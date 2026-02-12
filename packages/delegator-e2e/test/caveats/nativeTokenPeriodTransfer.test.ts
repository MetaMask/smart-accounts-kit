import { beforeEach, test, expect } from 'vitest';
import {
  encodeExecutionCalldatas,
  encodeDelegations,
  createCaveatBuilder,
} from '@metamask/smart-accounts-kit/utils';
import {
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  ROOT_AUTHORITY,
  createDelegation,
  createExecution,
} from '@metamask/smart-accounts-kit';
import type {
  MetaMaskSmartAccount,
  Delegation,
} from '@metamask/smart-accounts-kit';

import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  fundAddress,
  publicClient,
  randomAddress,
  stringToUnprefixedHex,
  deployPayableReceiver,
  getPayableReceiverBalance,
  getPayableReceiverTotalReceived,
  encodeReceiveEthCalldata,
  encodeReceiveEthAlternativeCalldata,
} from '../utils/helpers';
import { encodeFunctionData, type Hex, parseEther, concat } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let currentTime: number;
let payableReceiverAddress: Hex;
/**
 * These tests verify the native token period transfer caveat functionality.
 *
 * The native token period transfer caveat ensures that:
 * 1. No more than the specified amount of native token may be transferred per period
 * 2. The allowance resets at the beginning of each period.
 *
 * Alice creates a delegation to Bob with a native token period transfer caveat.
 * Bob redeems the delegation with native token transfers that must respect the period limits.
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

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  periodAmount: bigint,
  periodDuration: number,
  startDate: number,
  transferAmount: bigint,
  recipient: Hex,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: recipient, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const balanceBefore = await publicClient.getBalance({
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

  await expectUserOperationToSucceed(receipt);

  const balanceAfter = await publicClient.getBalance({
    address: recipient,
  });

  expect(balanceAfter).toBe(balanceBefore + transferAmount);
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  periodAmount: bigint,
  periodDuration: number,
  startDate: number,
  transferAmount: bigint,
  recipient: Hex,
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: recipient, value: transferAmount, callData: '0x' }],
      ]),
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

test('maincase: Bob redeems the delegation with transfers within period limit', async () => {
  const recipient = randomAddress();

  const periodAmount = parseEther('3');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime;
  const transferAmount = parseEther('3');

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
    recipient,
  );
});

test('Bob attempts to redeem the delegation with transfers exceeding period limit', async () => {
  const recipient = randomAddress();

  const periodAmount = parseEther('5');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime;
  const transferAmount = parseEther('6');

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
    recipient,
    'NativeTokenPeriodTransferEnforcer:transfer-amount-exceeded',
  );
});

test('Bob attempts to redeem the delegation before start date', async () => {
  const recipient = randomAddress();

  const periodAmount = parseEther('5');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime + 3600; // 1 hour;
  const transferAmount = parseEther('3');

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
    recipient,
    'NativeTokenPeriodTransferEnforcer:transfer-not-started',
  );
});

test('Bob attempts to redeem the delegation in the second period, with more than the period amount', async () => {
  const recipient = randomAddress();

  const periodAmount = parseEther('5');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime - 3600; // 1 hour ago;
  const transferAmount = parseEther('6');

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
    recipient,
    'NativeTokenPeriodTransferEnforcer:transfer-amount-exceeded',
  );
});

test('Bob attempts to redeem with invalid terms length', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPeriodTransfer', {
      periodAmount,
      periodDuration,
      startDate,
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: targetAddress, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const expectedError =
    'NativeTokenPeriodTransferEnforcer:invalid-terms-length';

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

test('Bob attempts to redeem with zero start date', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 3600; // 1 hour
  const startDate = 0; // Zero start date
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPeriodTransfer', {
      periodAmount,
      periodDuration,
      startDate: currentTime, // valid start date
    })
    .build();

  // Modify the terms to encode zero start date
  caveats[0].terms = concat([
    `0x${periodAmount.toString(16).padStart(64, '0')}`, // periodAmount
    `0x${periodDuration.toString(16).padStart(64, '0')}`, // periodDuration
    `0x${startDate.toString(16).padStart(64, '0')}`, // zero start date
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: targetAddress, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const expectedError =
    'NativeTokenPeriodTransferEnforcer:invalid-zero-start-date';

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

test('Bob attempts to redeem with zero period amount', async () => {
  const periodAmount = 0n; // Zero period amount
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPeriodTransfer', {
      periodAmount: 1n, // valid period amount
      periodDuration,
      startDate,
    })
    .build();

  // Modify the terms to encode zero period amount
  caveats[0].terms = concat([
    `0x${periodAmount.toString(16).padStart(64, '0')}`, // zero period amount
    `0x${periodDuration.toString(16).padStart(64, '0')}`, // periodDuration
    `0x${startDate.toString(16).padStart(64, '0')}`, // startDate
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: targetAddress, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const expectedError =
    'NativeTokenPeriodTransferEnforcer:invalid-zero-period-amount';

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

test('Bob attempts to redeem with zero period duration', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 0; // Zero period duration
  const startDate = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPeriodTransfer', {
      periodAmount,
      periodDuration: 3600, // valid period duration
      startDate,
    })
    .build();

  // Modify the terms to encode zero period duration
  caveats[0].terms = concat([
    `0x${periodAmount.toString(16).padStart(64, '0')}`, // periodAmount
    `0x${periodDuration.toString(16).padStart(64, '0')}`, // zero period duration
    `0x${startDate.toString(16).padStart(64, '0')}`, // startDate
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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: targetAddress, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const expectedError =
    'NativeTokenPeriodTransferEnforcer:invalid-zero-period-duration';

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

test('Bob attempts to redeem before start date', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 3600; // 1 hour
  const startDate = currentTime + 3600; // 1 hour in the future
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('nativeTokenPeriodTransfer', {
      periodAmount,
      periodDuration,
      startDate,
    })
    .build();

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

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([
        [{ target: targetAddress, value: transferAmount, callData: '0x' }],
      ]),
    ],
  });

  const expectedError =
    'NativeTokenPeriodTransferEnforcer:transfer-not-started';

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

test('Scope: Bob redeems the delegation with transfers within period limit using nativeTokenPeriodTransfer scope', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
  const transferAmount = parseEther('0.5');

  await runScopeTest_expectSuccess(
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
  );
});

test('Scope: Bob attempts to redeem the delegation exceeding period amount using nativeTokenPeriodTransfer scope', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
  const transferAmount = parseEther('1.5');

  await runScopeTest_expectFailure(
    periodAmount,
    periodDuration,
    startDate,
    transferAmount,
    'NativeTokenPeriodTransferEnforcer:transfer-amount-exceeded',
  );
});

const runScopeTest_expectSuccess = async (
  periodAmount: bigint,
  periodDuration: number,
  startDate: number,
  transferAmount: bigint,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'nativeTokenPeriodTransfer',
      periodAmount,
      periodDuration,
      startDate,
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: bobAddress,
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

  const balanceBefore = await publicClient.getBalance({
    address: bobAddress,
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

  const balanceAfter = await publicClient.getBalance({
    address: bobAddress,
  });

  expect(balanceAfter).toBe(balanceBefore + transferAmount);
};

const runScopeTest_expectFailure = async (
  periodAmount: bigint,
  periodDuration: number,
  startDate: number,
  transferAmount: bigint,
  expectedError: string,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'nativeTokenPeriodTransfer',
      periodAmount,
      periodDuration,
      startDate,
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: bobAddress,
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

test('Caveat with exactCalldata: Bob successfully redeems with exact calldata match', async () => {
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
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
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
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
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
  const transferAmount = parseEther('0.5');
  const allowedCalldata = { startIndex: 0, value: encodeReceiveEthCalldata() }; // Allow specific calldata

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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
  const periodAmount = parseEther('1');
  const periodDuration = 86400; // 1 day in seconds
  const startDate = currentTime;
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
      .addCaveat('nativeTokenPeriodTransfer', {
        periodAmount,
        periodDuration,
        startDate,
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
