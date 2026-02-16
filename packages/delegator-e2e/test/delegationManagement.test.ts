import { beforeEach, test, expect } from 'vitest';
import {
  createExecution,
  createDelegation,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import {
  encodeDelegations,
  encodeExecutionCalldatas,
  getDelegationHashOffchain,
} from '@metamask/smart-accounts-kit/utils';
import {
  DeleGatorCore,
  DelegationManager,
} from '@metamask/smart-accounts-kit/contracts';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  publicClient,
  fundAddress,
} from './utils/helpers';
import { expectUserOperationToSucceed } from './utils/assertions';
import { encodeFunctionData, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from './utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let bobSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let aliceCounter: CounterContract;

/**
 * These tests verify the delegation management functionality:
 * - disableDelegation: Allows a delegator to disable a delegation they've created
 * - enableDelegation: Allows a delegator to re-enable a previously disabled delegation
 * - disabledDelegations: Allows checking the status of delegations
 *
 * Test scenarios:
 * 1. Alice creates a delegation to Bob
 * 2. Bob uses the delegation successfully
 * 3. Alice disables the delegation
 * 4. Bob attempts to use the disabled delegation (should fail)
 * 5. Alice re-enables the delegation
 * 6. Bob uses the delegation again successfully
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

test('delegation management lifecycle: create, disable, enable, and check status', async () => {
  // Step 1: Create a delegation from Alice to Bob
  const delegation = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['increment()'],
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  const delegationHash = getDelegationHashOffchain(delegation);

  // Step 2: Verify Bob can use the delegation initially
  const countBefore = await aliceCounter.read.count();
  expect(countBefore).toEqual(0n);

  const execution = createExecution({
    target: aliceCounter.address,
    callData: encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'increment',
    }),
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

  let userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        value: 0n,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });

  let receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfterFirstUse = await aliceCounter.read.count();
  expect(countAfterFirstUse).toEqual(1n);

  // Step 3: Alice disables the delegation using smart-accounts-kit
  const disableData = DeleGatorCore.encode.disableDelegation({
    delegation,
  });

  userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 0n,
        data: disableData,
      },
    ],
    ...gasPrice,
  });

  receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  // Step 4: Verify the delegation is disabled using smart-accounts-kit
  const isDisabled = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash,
  });

  expect(isDisabled).toBe(true);

  // Step 5: Bob attempts to use the disabled delegation (should fail)
  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          value: 0n,
          data: redeemData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow();

  // Verify counter hasn't changed
  const countAfterDisable = await aliceCounter.read.count();
  expect(countAfterDisable).toEqual(1n);

  // Step 6: Alice re-enables the delegation using smart-accounts-kit
  const enableData = DeleGatorCore.encode.enableDelegation({
    delegation,
  });

  userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 0n,
        data: enableData,
      },
    ],
    ...gasPrice,
  });

  receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  // Step 7: Verify the delegation is no longer disabled using smart-accounts-kit
  const isStillDisabled = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash,
  });

  expect(isStillDisabled).toBe(false);

  // Step 8: Bob uses the re-enabled delegation successfully
  userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [
      {
        to: bobSmartAccount.address,
        value: 0n,
        data: redeemData,
      },
    ],
    ...gasPrice,
  });

  receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const finalCount = await aliceCounter.read.count();
  expect(finalCount).toEqual(2n);
});

test('only delegator can disable their own delegation', async () => {
  // Create a delegation from Alice to Bob
  const delegation = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['increment()'],
    },
  });

  // Bob attempts to disable Alice's delegation (should fail)
  const disableData = DeleGatorCore.encode.disableDelegation({
    delegation,
  });

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          value: 0n,
          data: disableData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow();
});

test('only delegator can enable their own delegation', async () => {
  // Create and disable a delegation from Alice to Bob
  const delegation = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['increment()'],
    },
  });

  // Alice disables the delegation first
  const disableData = DeleGatorCore.encode.disableDelegation({
    delegation,
  });

  let userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 0n,
        data: disableData,
      },
    ],
    ...gasPrice,
  });

  let receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  // Bob attempts to enable Alice's delegation (should fail)
  const enableData = DeleGatorCore.encode.enableDelegation({
    delegation,
  });

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          value: 0n,
          data: enableData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow();
});

test('disabling non-existent delegation should succeed silently', async () => {
  // Create a delegation that was never actually used
  const delegation = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['increment()'],
    },
  });

  // Alice disables the delegation even though it was never used
  const disableData = DeleGatorCore.encode.disableDelegation({
    delegation,
  });

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 0n,
        data: disableData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  // Verify the delegation is now disabled
  const delegationHash = getDelegationHashOffchain(delegation);
  const isDisabled = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash,
  });

  expect(isDisabled).toBe(true);
});

test('can check delegation status using disabledDelegations', async () => {
  // Create multiple delegations
  const delegation1 = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['increment()'],
    },
  });

  const delegation2 = createDelegation({
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounter.address],
      selectors: ['decrement()'],
    },
  });

  const delegationHash1 = getDelegationHashOffchain(delegation1);
  const delegationHash2 = getDelegationHashOffchain(delegation2);

  // Initially, both delegations should not be disabled
  let isDisabled1 = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash: delegationHash1,
  });

  let isDisabled2 = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash: delegationHash2,
  });

  expect(isDisabled1).toBe(false);
  expect(isDisabled2).toBe(false);

  // Disable only the first delegation
  const disableData = DeleGatorCore.encode.disableDelegation({
    delegation: delegation1,
  });

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 0n,
        data: disableData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  // Check status again
  isDisabled1 = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash: delegationHash1,
  });

  isDisabled2 = await DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: aliceSmartAccount.environment.DelegationManager,
    delegationHash: delegationHash2,
  });

  expect(isDisabled1).toBe(true);
  expect(isDisabled2).toBe(false);
});
