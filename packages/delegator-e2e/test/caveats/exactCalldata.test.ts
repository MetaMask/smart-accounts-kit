import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  ROOT_AUTHORITY,
  type Delegation,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeDelegations,
  encodeExecutionCalldatas,
} from '@metamask/smart-accounts-kit/utils';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  fundAddress,
  stringToUnprefixedHex,
  publicClient,
} from '../utils/helpers';
import { encodeFunctionData, type Hex, parseEther, slice } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;

/**
 * These tests verify the exact calldata caveat functionality.
 *
 * The exact calldata caveat ensures that the provided execution calldata matches exactly
 * with the expected calldata.
 *
 * Alice creates a delegation to Bob with an exact calldata caveat.
 * Bob redeems the delegation with an execution that must match exactly.
 */

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
  await fundAddress(aliceSmartAccount.address, parseEther('10'));

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  aliceCounter = await deployCounter(aliceSmartAccount.address);
});

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount,
  calldata: Hex,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('exactCalldata', { calldata })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

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
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  expectedCalldata: Hex,
  actualCalldata: Hex,
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('exactCalldata', { calldata: expectedCalldata })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: aliceCounter.address,
    callData: actualCalldata,
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
};

test('maincase: Bob redeems the delegation with exact matching calldata', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    incrementCalldata,
  );
});

test('Bob attempts to redeem the delegation with mismatched calldata', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const setCountCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'setCount',
    args: [1n],
  });

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    incrementCalldata,
    setCountCalldata,
    'ExactCalldataEnforcer:invalid-calldata',
  );
});

test('Bob fails to redeem when expected calldata is a prefix of the actual calldata', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    slice(incrementCalldata, 0, 2),
    incrementCalldata,
    'ExactCalldataEnforcer:invalid-calldata',
  );
});
