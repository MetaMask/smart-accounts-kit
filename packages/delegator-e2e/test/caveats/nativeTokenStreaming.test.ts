import { beforeEach, test, expect } from 'vitest';
import {
  encodeExecutionCalldatas,
  encodeDelegations,
  createCaveatBuilder,
} from '@metamask/smart-accounts-kit/utils';
import {
  createExecution,
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  ROOT_AUTHORITY,
  createDelegation,
} from '@metamask/smart-accounts-kit';
import type {
  MetaMaskSmartAccount,
  Delegation,
} from '@metamask/smart-accounts-kit';

import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  fundAddress,
  randomAddress,
  stringToUnprefixedHex,
  deployPayableReceiver,
  getPayableReceiverBalance,
  getPayableReceiverTotalReceived,
  encodeReceiveEthCalldata,
  encodeReceiveEthAlternativeCalldata,
} from '../utils/helpers';
import { encodeFunctionData, Hex, parseEther, type Address } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { concat } from 'viem';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let currentTime: number;
let payableReceiverAddress: Hex;

/**
 * These tests verify the native token streaming caveat functionality.
 *
 * The native token streaming caveat allows a delegator to grant permission to a delegate
 * to transfer native tokens (ETH) with the following constraints:
 * - initialAmount: Amount available immediately
 * - maxAmount: Maximum total amount that can be transferred
 * - amountPerSecond: Rate at which additional allowance accrues
 * - startTime: Timestamp when streaming begins
 *
 * The available amount at any time is calculated as:
 * min(initialAmount + amountPerSecond * (currentTime - startTime), maxAmount)
 *
 * Alice creates a delegation to Carol with a native token streaming caveat.
 * Bob redeems the delegation, transferring the amount to a third party.
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

  const { timestamp } = await publicClient.getBlock({ blockTag: 'latest' });
  currentTime = Number(timestamp);

  payableReceiverAddress = await deployPayableReceiver();
});

test('maincase: Bob redeems the delegation with initial amount available', async () => {
  const initialAmount = parseEther('1');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('.5');
  const startTime = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter - balanceBefore).toEqual(transferAmount);
});

test('Bob attempts to redeem the delegation before startTime', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime + 3600; // 1 hour in the future
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'NativeTokenStreamingEnforcer:allowance-exceeded',
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter).toEqual(balanceBefore);
});

test('Bob redeems the delegation with exact initial amount', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime;
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter - balanceBefore).toEqual(transferAmount);
});

test('Bob attempts to redeem the delegation with amount exceeding initial allowance', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime;
  const transferAmount = parseEther('6');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'NativeTokenStreamingEnforcer:allowance-exceeded',
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter).toEqual(balanceBefore);
});

test('Bob redeems the delegation with accrued tokens after time passes', async () => {
  // This test simulates time passing by using a startTime in the past
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('1');
  // Set startTime to 5 seconds in the past
  const startTime = currentTime - 5;
  // Should have 5 (initial) + 5 (accrued) = 10 ETH available
  const transferAmount = parseEther('8');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter - balanceBefore).toEqual(transferAmount);
});

test('Bob cannot exceed max amount even after long time', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('10');
  // Set startTime to 100 seconds in the past (would accrue 1000 ETH at 10 ETH/sec)
  const startTime = currentTime - 100;
  // Try to transfer more than max
  const transferAmount = parseEther('11');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'NativeTokenStreamingEnforcer:allowance-exceeded',
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter).toEqual(balanceBefore);
});

test('Bob can transfer exactly max amount after sufficient time', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('1');
  // Set startTime to 10 seconds in the past
  const startTime = currentTime - 10;
  // Should have min(5 + 10, 10) = 10 ETH available
  const transferAmount = parseEther('10');

  const targetAddress = randomAddress();

  const balanceBefore = await publicClient.getBalance({
    address: targetAddress,
  });

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
  );

  const balanceAfter = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(balanceAfter - balanceBefore).toEqual(transferAmount);
});

test('Bob attempts to redeem with invalid terms length', async () => {
  const initialAmount = parseEther('1');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('.5');
  const startTime = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenStreaming', {
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
    })
    .build();

  // Create invalid terms length by appending an empty byte
  caveats[0].terms = concat([caveats[0].terms, '0x00']);

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats,
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: targetAddress,
    value: transferAmount,
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

  const expectedError = 'NativeTokenStreamingEnforcer:invalid-terms-length';

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
});

test('Bob attempts to redeem with invalid max amount', async () => {
  const initialAmount = parseEther('10');
  const maxAmount = parseEther('5'); // maxAmount less than initialAmount
  const amountPerSecond = parseEther('.5');
  const startTime = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenStreaming', {
      initialAmount,
      maxAmount: initialAmount + 1n, // we need a valid maxAmount
      amountPerSecond,
      startTime,
    })
    .build();

  caveats[0].terms = concat([
    `0x${initialAmount.toString(16).padStart(64, '0')}`, // initialAmount
    `0x${maxAmount.toString(16).padStart(64, '0')}`, // maxAmount
    `0x${amountPerSecond.toString(16).padStart(64, '0')}`, // amountPerSecond
    `0x${startTime.toString(16).padStart(64, '0')}`, // zero start time
  ]);

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats,
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: targetAddress,
    value: transferAmount,
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

  const expectedError = 'NativeTokenStreamingEnforcer:invalid-max-amount';

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
});

test('Bob attempts to redeem with zero start time', async () => {
  const initialAmount = parseEther('1');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('.5');
  const startTime = 0; // Zero start time
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenStreaming', {
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime: currentTime, // valid start time
    })
    .build();

  // Modify the terms to encode zero start time
  caveats[0].terms = concat([
    `0x${initialAmount.toString(16).padStart(64, '0')}`, // initialAmount
    `0x${maxAmount.toString(16).padStart(64, '0')}`, // maxAmount
    `0x${amountPerSecond.toString(16).padStart(64, '0')}`, // amountPerSecond
    `0x${startTime.toString(16).padStart(64, '0')}`, // zero start time
  ]);

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats,
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: targetAddress,
    value: transferAmount,
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

  const expectedError = 'NativeTokenStreamingEnforcer:invalid-zero-start-time';

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
});

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: Address,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
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
    target: recipient,
    value: transferAmount,
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

  const recipientBalanceBefore = await publicClient.getBalance({
    address: recipient,
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

  const recipientBalanceAfter = await publicClient.getBalance({
    address: recipient,
  });

  expect(
    recipientBalanceAfter - recipientBalanceBefore,
    'Expected recipient balance to increase by transfer amount',
  ).toEqual(transferAmount);
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: Address,
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
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
    target: recipient,
    value: transferAmount,
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

  const recipientBalanceBefore = await publicClient.getBalance({
    address: recipient,
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

  const recipientBalanceAfter = await publicClient.getBalance({
    address: recipient,
  });
  expect(
    recipientBalanceAfter,
    'Expected recipient balance to remain unchanged',
  ).toEqual(recipientBalanceBefore);
};

test('Scope: Bob redeems the delegation with initial amount available using nativeTokenStreaming scope', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('0.5');
  const recipient = randomAddress();

  await runScopeTest_expectSuccess(
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    recipient,
  );
});

test('Scope: Bob attempts to redeem the delegation exceeding initial amount using nativeTokenStreaming scope', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('1');
  const recipient = randomAddress();

  await runScopeTest_expectFailure(
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    recipient,
    'NativeTokenStreamingEnforcer:allowance-exceeded',
  );
});

const runScopeTest_expectSuccess = async (
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: Hex,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'nativeTokenStreaming',
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: recipient,
    value: transferAmount,
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

  const recipientBalanceBefore = await publicClient.getBalance({
    address: recipient,
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

  const recipientBalanceAfter = await publicClient.getBalance({
    address: recipient,
  });

  expect(
    recipientBalanceAfter - recipientBalanceBefore,
    'Expected recipient balance to increase by transfer amount',
  ).toEqual(transferAmount);
};

const runScopeTest_expectFailure = async (
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: Hex,
  expectedError: string,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'nativeTokenStreaming',
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: recipient,
    value: transferAmount,
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

  const recipientBalanceBefore = await publicClient.getBalance({
    address: recipient,
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

  const recipientBalanceAfter = await publicClient.getBalance({
    address: recipient,
  });
  expect(
    recipientBalanceAfter,
    'Expected recipient balance to remain unchanged',
  ).toEqual(recipientBalanceBefore);
};

test('Caveat with exactCalldata: Bob successfully redeems with exact calldata match', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('0.5');
  const exactCalldata = encodeReceiveEthCalldata();

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
      .addCaveat('exactCalldata', { calldata: exactCalldata })
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
    target: payableReceiverAddress,
    value: transferAmount,
    callData: exactCalldata, // Exact match
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

  const contractBalanceBefore = await getPayableReceiverBalance(
    payableReceiverAddress,
  );
  const totalReceivedBefore = await getPayableReceiverTotalReceived(
    payableReceiverAddress,
  );

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

  const contractBalanceAfter = await getPayableReceiverBalance(
    payableReceiverAddress,
  );
  const totalReceivedAfter = await getPayableReceiverTotalReceived(
    payableReceiverAddress,
  );

  expect(
    contractBalanceAfter - contractBalanceBefore,
    'Expected contract balance to increase by transfer amount',
  ).toEqual(transferAmount);

  expect(
    totalReceivedAfter - totalReceivedBefore,
    'Expected totalReceived to increase by transfer amount',
  ).toEqual(transferAmount);
});

test('Caveat with exactCalldata: Bob fails to redeem with wrong calldata', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('0.5');
  const exactCalldata = encodeReceiveEthCalldata();
  const wrongCalldata = encodeReceiveEthAlternativeCalldata(); // Different function

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
      .addCaveat('exactCalldata', { calldata: exactCalldata })
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
    target: payableReceiverAddress,
    value: transferAmount,
    callData: wrongCalldata, // Wrong calldata
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
  ).rejects.toThrow(
    stringToUnprefixedHex('ExactCalldataEnforcer:invalid-calldata'),
  );
});

test('Caveat with allowedCalldata: Bob successfully redeems with allowed calldata pattern', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('0.5');
  const allowedCalldata = { startIndex: 0, value: encodeReceiveEthCalldata() };

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
      .addCaveat('allowedCalldata', allowedCalldata)
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
    target: payableReceiverAddress,
    value: transferAmount,
    callData: encodeReceiveEthCalldata(), // Matches allowed calldata
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

  const contractBalanceBefore = await getPayableReceiverBalance(
    payableReceiverAddress,
  );
  const totalReceivedBefore = await getPayableReceiverTotalReceived(
    payableReceiverAddress,
  );

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

  const contractBalanceAfter = await getPayableReceiverBalance(
    payableReceiverAddress,
  );
  const totalReceivedAfter = await getPayableReceiverTotalReceived(
    payableReceiverAddress,
  );

  expect(
    contractBalanceAfter - contractBalanceBefore,
    'Expected contract balance to increase by transfer amount',
  ).toEqual(transferAmount);

  expect(
    totalReceivedAfter - totalReceivedBefore,
    'Expected totalReceived to increase by transfer amount',
  ).toEqual(transferAmount);
});

test('Caveat with allowedCalldata: Bob fails to redeem with disallowed calldata pattern', async () => {
  const initialAmount = parseEther('0.5');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('0.5');
  const allowedCalldata = { startIndex: 0, value: encodeReceiveEthCalldata() }; // Only allow specific calldata

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenStreaming', {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      })
      .addCaveat('allowedCalldata', allowedCalldata)
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
    target: payableReceiverAddress,
    value: transferAmount,
    callData: encodeReceiveEthAlternativeCalldata(), // Different from allowed calldata
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
  ).rejects.toThrow(
    stringToUnprefixedHex('AllowedCalldataEnforcer:invalid-calldata'),
  );
});
