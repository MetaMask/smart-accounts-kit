import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
  ExecutionMode,
  ROOT_AUTHORITY,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeExecutionCalldatas,
  encodeDelegations,
} from '@metamask/smart-accounts-kit/utils';

import {
  fundAddress,
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  stringToUnprefixedHex,
} from '../utils/helpers';
import { encodeFunctionData, parseEther } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;

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

  await fundAddress(await aliceSmartAccount.address, parseEther('2'));
});

/*
  Main test case:

  Alice creates a DeleGatorSmartAccount for a deployed Hybrid Delegator Account.
  Bob creates a DeleGatorSmartAccount for a counterfactual Hybrid Delegator Account.

  Alice creates a delegation to Bob's delegator account, with a ValueLte
  caveat that limits the maximum value of native tokens Bob can spend.

  Bob redeems the delegation by sending a transaction with a value within
  the specified limit.
*/

test('maincase: Bob redeems the delegation with a value within the specified limit', async () => {
  const maxValue = parseEther('1'); // 1 ETH
  const executionValue = parseEther('0.5'); // 0.5 ETH

  await runTest_expectSuccess(maxValue, executionValue);
});

test('Bob redeems the delegation with the maximum allowed value', async () => {
  const maxValue = parseEther('1'); // 1 ETH
  const executionValue = parseEther('1'); // 1 ETH

  await runTest_expectSuccess(maxValue, executionValue);
});

test('Bob redeems the delegation with a very small value', async () => {
  const maxValue = parseEther('1'); // 1 ETH
  const executionValue = parseEther('0.000001'); // 0.000001 ETH

  await runTest_expectSuccess(maxValue, executionValue);
});

test('Bob attempts to redeem the delegation with a value exceeding the specified limit', async () => {
  const maxValue = parseEther('1'); // 1 ETH
  const executionValue = parseEther('1.5'); // 1.5 ETH

  await runTest_expectFailure(
    maxValue,
    executionValue,
    'ValueLteEnforcer:value-too-high',
  );
});

test('Bob attempts to redeem the delegation where the value is 0', async () => {
  const maxValue = 0n;
  const executionValue = 1n;

  await runTest_expectFailure(
    maxValue,
    executionValue,
    'ValueLteEnforcer:value-too-high',
  );
});

const submitUserOperationForTest = async (
  maxValue: bigint,
  executionValue: bigint,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('valueLte', { maxValue })
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
    target: bobAddress,
    value: executionValue,
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

  return sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });
};

const runTest_expectSuccess = async (
  maxValue: bigint,
  executionValue: bigint,
) => {
  const useroperationHash = await submitUserOperationForTest(
    maxValue,
    executionValue,
  );

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: useroperationHash,
  });

  expectUserOperationToSucceed(receipt);
};

const runTest_expectFailure = async (
  maxValue: bigint,
  executionValue: bigint,
  expectedError: string,
) => {
  await expect(
    submitUserOperationForTest(maxValue, executionValue),
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));
};
