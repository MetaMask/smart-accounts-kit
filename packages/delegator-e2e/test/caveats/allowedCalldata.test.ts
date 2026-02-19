import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
  ExecutionMode,
  ROOT_AUTHORITY,
  Delegation,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeExecutionCalldatas,
  encodeDelegations,
} from '@metamask/smart-accounts-kit/utils';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  randomBytes,
  publicClient,
  stringToUnprefixedHex,
} from '../utils/helpers';
import { encodeFunctionData, Hex, hexToBigInt, slice } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: alice },
  });

  await deploySmartAccount(aliceSmartAccount);

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  aliceCounter = await deployCounter(aliceSmartAccount.address);
});

/*
  Main test case:

  Alice creates a DeleGatorSmartAccount for a deployed Hybrid Delegator Account, and
  deploys a counter contract.

  Bob creates a DeleGatorSmartAccount for a counterfactual Hybrid Delegator Account.

  Alice creates a delegation to Bob's delegator account, with an AllowedCalldata
  caveat.

  Bob redeems the delegation calling setCount() on the counter contract.
*/

test('maincase: Bob redeems the delegation with the exact calldata', async () => {
  const calldata = randomBytes(32);
  const newCount = hexToBigInt(calldata);

  await runTest_expectSuccess(newCount, [{ from: 4, calldata }]);
});

test('Bob redeems the delegation where the delegation requires a substring of the calldata', async () => {
  const calldata = randomBytes(32);
  const newCount = hexToBigInt(calldata);

  const requiredCalldata = slice(calldata, 0, 34);

  await runTest_expectSuccess(newCount, [
    { from: 4, calldata: requiredCalldata },
  ]);
});

test('Bob redeems the delegation where the calldata matches multiple caveats', async () => {
  const calldata = randomBytes(32);
  const newCount = hexToBigInt(calldata);

  const firstSlice = slice(calldata, 0, 34);
  const secondSlice = slice(calldata, 20);

  await runTest_expectSuccess(newCount, [
    { from: 4, calldata: firstSlice },
    { from: 24, calldata: secondSlice },
  ]);
});

test('Bob attempts to redeem the delegation with incorrect calldata', async () => {
  const newCount = 1n;

  const executedCalldata = encodeFunctionData({
    abi: aliceCounter.abi,
    functionName: 'setCount',
    args: [newCount],
  });

  await runTest_expectFailure(
    executedCalldata,
    [{ from: 0, calldata: randomBytes(32) }],
    'AllowedCalldataEnforcer:invalid-calldata',
  );
});

test('Bob attempts to redeem the delegation with no calldata', async () => {
  const executedCalldata = '0x';

  await runTest_expectFailure(
    executedCalldata,
    [{ from: 0, calldata: randomBytes(32) }],
    'AllowedCalldataEnforcer:invalid-calldata',
  );
});

const runTest_expectSuccess = async (
  newCount: bigint,
  caveats: { from: number; calldata: Hex }[],
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: caveats
      .reduce((builder, caveat) => {
        builder.addCaveat('allowedCalldata', {
          startIndex: caveat.from,
          value: caveat.calldata,
        });
        return builder;
      }, createCaveatBuilder(environment))
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const executedCalldata = encodeFunctionData({
    abi: aliceCounter.abi,
    functionName: 'setCount',
    args: [newCount],
  });

  const execution = createExecution({
    target: aliceCounter.address,
    callData: executedCalldata,
  });

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[execution]]),
    ],
  });

  const countBefore = await aliceCounter.read.count?.();
  expect(countBefore, 'Expected initial count to be 0n').toEqual(0n);

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfter = await aliceCounter.read.count?.();
  expect(countAfter, `Expected final count to be ${newCount}`).toEqual(
    newCount,
  );
};

const runTest_expectFailure = async (
  executedCalldata: Hex,
  caveats: { from: number; calldata: Hex }[],
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: caveats
      .reduce((builder, caveat) => {
        builder.addCaveat('allowedCalldata', {
          startIndex: caveat.from,
          value: caveat.calldata,
        });
        return builder;
      }, createCaveatBuilder(environment))
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: aliceCounter.address,
    callData: executedCalldata,
  });

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[execution]]),
    ],
  });

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          data: redeemData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));

  const counterAfter = await aliceCounter.read.count?.();
  expect(counterAfter, 'Expected count to remain 0n').toEqual(0n);
};
