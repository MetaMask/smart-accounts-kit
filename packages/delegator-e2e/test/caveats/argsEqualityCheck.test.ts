import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  type MetaMaskSmartAccount,
  ROOT_AUTHORITY,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeExecutionCalldatas,
  encodeDelegations,
} from '@metamask/smart-accounts-kit/utils';
import {
  transport,
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  randomBytes,
  publicClient,
  stringToUnprefixedHex,
} from '../utils/helpers';
import { encodeFunctionData, Hex, concat, slice } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

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

  Alice creates a delegation to Bob's delegator account, with an
  ArgsEqualityCheck caveat.

  Bob redeems the delegation with a call to increment() after setting the args
  to match the expected args.
*/

test('maincase: Bob redeems the delegation with matching arguments', async () => {
  const expectedArgs = randomBytes(32);

  await runTest_expectSuccess(expectedArgs, expectedArgs);
});

test('Bob redeems the delegation with empty arguments when expected', async () => {
  const expectedArgs = '0x';

  await runTest_expectSuccess(expectedArgs, expectedArgs);
});

test('Bob attempts to redeem the delegation with mismatched arguments', async () => {
  const expectedArgs = randomBytes(32);
  const actualArgs = randomBytes(32);

  await runTest_expectFailure(
    expectedArgs,
    actualArgs,
    'ArgsEqualityCheckEnforcer:different-args-and-terms',
  );
});

test('Bob attempts to redeem the delegation with args that begin with expected args', async () => {
  const expectedArgs = randomBytes(32);
  const actualArgs = concat([expectedArgs, randomBytes(32)]);

  await runTest_expectFailure(
    expectedArgs,
    actualArgs,
    'ArgsEqualityCheckEnforcer:different-args-and-terms',
  );
});

test('Bob attempts to redeem the delegation with args that are a prefix of expected args', async () => {
  const expectedArgs = randomBytes(32);
  const actualArgs = slice(expectedArgs, 0, 16);

  await runTest_expectFailure(
    expectedArgs,
    actualArgs,
    'ArgsEqualityCheckEnforcer:different-args-and-terms',
  );
});

test('Bob attempts to redeem the delegation with args when none are expected', async () => {
  const expectedArgs = '0x';
  const actualArgs = randomBytes(32);

  await runTest_expectFailure(
    expectedArgs,
    actualArgs,
    'ArgsEqualityCheckEnforcer:different-args-and-terms',
  );
});

const runTest_expectSuccess = async (args: Hex, actualArgs: Hex) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('argsEqualityCheck', { args })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  signedDelegation.caveats[0].args = actualArgs;

  const calldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
    args: [],
  });

  const execution = createExecution({
    target: aliceCounter.address,
    callData: calldata,
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

  const countBefore = await aliceCounter.read.count();
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

  const countAfter = await aliceCounter.read.count();
  expect(countAfter, 'Expected final count to be 1n').toEqual(1n);
};

const runTest_expectFailure = async (
  args: Hex,
  actualArgs: Hex,
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('argsEqualityCheck', { args })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  signedDelegation.caveats[0].args = actualArgs;

  const calldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
    args: [],
  });

  const execution = createExecution({
    target: aliceCounter.address,
    callData: calldata,
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

  const counterAfter = await aliceCounter.read.count();
  expect(counterAfter, 'Expected count to remain 0n').toEqual(0n);
};
