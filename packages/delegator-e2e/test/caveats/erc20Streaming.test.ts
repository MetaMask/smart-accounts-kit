import { beforeEach, test, expect } from 'vitest';
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
  ExecutionStruct,
  Delegation,
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
  publicClient,
  fundAddress,
  randomAddress,
  fundAddressWithErc20Token,
  deployErc20Token,
  getErc20Balance,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  concat,
  encodeFunctionData,
  Hex,
  parseEther,
  type Address,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';
const { abi: erc20TokenAbi } = ERC20Token;

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let currentTime: number;
let erc20TokenAddress: Hex;

/**
 * These tests verify the ERC20 streaming caveat functionality.
 *
 * The ERC20 streaming caveat allows a delegator to grant permission to a delegate
 * to transfer ERC20 tokens with the following constraints:
 * - initialAmount: Amount available immediately
 * - maxAmount: Maximum total amount that can be transferred
 * - amountPerSecond: Rate at which additional allowance accrues
 * - startTime: Timestamp when streaming begins
 *
 * The available amount at any time is calculated as:
 * min(initialAmount + amountPerSecond * (currentTime - startTime), maxAmount)
 *
 * Alice creates a delegation to Bob with an ERC20 token streaming caveat.
 * Bob redeems the delegation, transferring the amount to a third party.
 */

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  erc20TokenAddress = await deployErc20Token();

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

  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress,
    parseEther('10'),
  );

  const { timestamp } = await publicClient.getBlock({ blockTag: 'latest' });
  currentTime = Number(timestamp);
});

test('maincase: Bob redeems the delegation with initial amount available', async () => {
  const initialAmount = parseEther('1');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('.5');
  const startTime = currentTime;
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

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
});

test('Bob attempts to redeem the delegation before startTime', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime + 3600; // 1 hour in the future
  const transferAmount = parseEther('1');

  const targetAddress = randomAddress();

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:allowance-exceeded',
  );
});

test('Bob redeems the delegation with exact initial amount', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime;
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

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
});

test('Bob attempts to redeem the delegation with amount exceeding initial allowance', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('0.000000001');
  const startTime = currentTime;
  const transferAmount = parseEther('6');

  const targetAddress = randomAddress();

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:allowance-exceeded',
  );
});

test('Bob attempts to redeem the delegation with invalid method', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('0.000000001');
  const startTime = currentTime;
  const transferAmount = parseEther('6');

  const targetAddress = randomAddress();

  const execution = {
    target: erc20TokenAddress,
    value: 0n,
    callData: encodeFunctionData({
      abi: erc20TokenAbi,
      functionName: 'approve',
      args: [targetAddress, transferAmount],
    }),
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:invalid-method',
    execution,
  );
});

test('Bob attempts to redeem the delegation with invalid contract', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('0.000000001');
  const startTime = currentTime;
  const transferAmount = parseEther('6');

  const targetAddress = randomAddress();

  const execution = {
    target: randomAddress(),
    value: 0n,
    callData: encodeFunctionData({
      abi: erc20TokenAbi,
      functionName: 'transfer',
      args: [targetAddress, transferAmount],
    }),
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:invalid-contract',
    execution,
  );
});

test('Bob attempts to redeem the delegation with invalid execution length', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('0.000000001');
  const startTime = currentTime;
  const transferAmount = parseEther('6');

  const targetAddress = randomAddress();

  const execution = {
    target: randomAddress(),
    value: 0n,
    callData: concat([
      encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [targetAddress, transferAmount],
      }),
      '0x00',
    ]),
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:invalid-execution-length',
    execution,
  );
});

test('Bob attempts to redeem the delegation before the start time', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  // Set startTime to 30 seconds in the future
  const startTime = currentTime + 30;
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:allowance-exceeded',
  );
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
});

test('Bob cannot exceed max amount even after long time', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('10');
  // Set startTime to 100 seconds in the past (would accrue 1000 tokens at 10 tokens/sec)
  const startTime = currentTime - 100;
  // Try to transfer more than max
  const transferAmount = parseEther('11');

  const targetAddress = randomAddress();

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    targetAddress,
    'ERC20StreamingEnforcer:allowance-exceeded',
  );
});

test('Bob can transfer exactly max amount after sufficient time', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('10');
  const amountPerSecond = parseEther('1');
  // Set startTime to 10 seconds in the past
  const startTime = currentTime - 10;
  // Should have min(5 + 10, 10) = 10 tokens available
  const transferAmount = parseEther('10');

  const targetAddress = randomAddress();

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
});

test('Bob attempts to redeem with invalid terms length', async () => {
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = currentTime;
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('erc20Streaming', {
      tokenAddress: erc20TokenAddress,
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
    })
    .build();

  // create invalid terms length by appending an empty byte
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

  const calldata = encodeFunctionData({
    abi: erc20TokenAbi,
    functionName: 'transfer',
    args: [targetAddress, transferAmount],
  });

  const execution = createExecution({
    target: erc20TokenAddress,
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

  const expectedError = 'ERC20StreamingEnforcer:invalid-terms-length';

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

test('Bob attempts to redeem with maxAmount less than initialAmount', async () => {
  const initialAmount = parseEther('10');
  const maxAmount = parseEther('5'); // maxAmount < initialAmount
  const amountPerSecond = parseEther('2');
  const startTime = currentTime;
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('erc20Streaming', {
      tokenAddress: erc20TokenAddress,
      initialAmount,
      maxAmount: initialAmount + 1n, // we need a valid maxAmount
      amountPerSecond,
      startTime,
    })
    .build();

  // Modify the terms to encode maxAmount < initialAmount
  caveats[0].terms = concat([
    erc20TokenAddress, // token address (20 bytes)
    `0x${initialAmount.toString(16).padStart(64, '0')}`, // initialAmount
    `0x${maxAmount.toString(16).padStart(64, '0')}`, // maxAmount (less than initialAmount)
    `0x${amountPerSecond.toString(16).padStart(64, '0')}`, // amountPerSecond
    `0x${startTime.toString(16).padStart(64, '0')}`, // startTime
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

  const calldata = encodeFunctionData({
    abi: erc20TokenAbi,
    functionName: 'transfer',
    args: [targetAddress, transferAmount],
  });

  const execution = createExecution({
    target: erc20TokenAddress,
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

  const expectedError = 'ERC20StreamingEnforcer:invalid-max-amount';

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
  const initialAmount = parseEther('5');
  const maxAmount = parseEther('20');
  const amountPerSecond = parseEther('2');
  const startTime = 0; // Zero start time
  const transferAmount = parseEther('5');

  const targetAddress = randomAddress();

  const { environment } = aliceSmartAccount;
  const caveats = createCaveatBuilder(environment)
    .addCaveat('erc20Streaming', {
      tokenAddress: erc20TokenAddress,
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime: currentTime, // valid start time
    })
    .build();

  // Modify the terms to encode zero start time
  caveats[0].terms = concat([
    erc20TokenAddress, // token address (20 bytes)
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

  const calldata = encodeFunctionData({
    abi: erc20TokenAbi,
    functionName: 'transfer',
    args: [targetAddress, transferAmount],
  });

  const execution = createExecution({
    target: erc20TokenAddress,
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

  const expectedError = 'ERC20StreamingEnforcer:invalid-zero-start-time';

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
      .addCaveat('erc20Streaming', {
        tokenAddress: erc20TokenAddress,
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

  // Create an ERC20 transfer execution
  const execution = createExecution({
    target: erc20TokenAddress,
    callData: encodeFunctionData({
      abi: erc20TokenAbi,
      functionName: 'transfer',
      args: [recipient as Address, transferAmount],
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

  const recipientBalanceBefore = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
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

  const recipientBalanceAfter = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

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
  execution?: ExecutionStruct,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('erc20Streaming', {
        tokenAddress: erc20TokenAddress,
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

  if (!execution) {
    // Create an ERC20 transfer execution
    execution = createExecution({
      target: erc20TokenAddress,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [recipient as Address, transferAmount],
      }),
    });
  }

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [encodeDelegations([signedDelegation])],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[execution]]),
    ],
  });

  const recipientBalanceBefore = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

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

  const recipientBalanceAfter = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

  expect(
    recipientBalanceAfter,
    'Expected recipient balance to remain unchanged',
  ).toEqual(recipientBalanceBefore);
};

test('Scope: Bob redeems the delegation with an allowed streaming amount using erc20Streaming scope', async () => {
  const initialAmount = parseEther('1');
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

test('Scope: Bob attempts to redeem the delegation exceeding max amount using erc20Streaming scope', async () => {
  const initialAmount = parseEther('1');
  const maxAmount = parseEther('2');
  const amountPerSecond = parseEther('0.1');
  const startTime = currentTime;
  const transferAmount = parseEther('3');
  const recipient = randomAddress();

  await runScopeTest_expectFailure(
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
    transferAmount,
    recipient,
    'ERC20StreamingEnforcer:allowance-exceeded',
  );
});

const runScopeTest_expectSuccess = async (
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: string,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'erc20Streaming',
      tokenAddress: erc20TokenAddress,
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
    target: erc20TokenAddress,
    value: 0n,
    callData: encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'transfer',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'transfer',
      args: [recipient as Address, transferAmount],
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

  const recipientBalanceBefore = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
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

  const recipientBalanceAfter = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

  expect(
    recipientBalanceAfter,
    'Expected recipient balance to increase by transfer amount',
  ).toEqual(recipientBalanceBefore + transferAmount);
};

const runScopeTest_expectFailure = async (
  initialAmount: bigint,
  maxAmount: bigint,
  amountPerSecond: bigint,
  startTime: number,
  transferAmount: bigint,
  recipient: string,
  expectedError: string,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'erc20Streaming',
      tokenAddress: erc20TokenAddress,
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
    target: erc20TokenAddress,
    value: 0n,
    callData: encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'transfer',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
        },
      ],
      functionName: 'transfer',
      args: [recipient as Address, transferAmount],
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

  const recipientBalanceBefore = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

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

  const recipientBalanceAfter = await getErc20Balance(
    recipient as Address,
    erc20TokenAddress,
  );

  expect(
    recipientBalanceAfter,
    'Expected recipient balance to remain unchanged',
  ).toEqual(recipientBalanceBefore);
};
