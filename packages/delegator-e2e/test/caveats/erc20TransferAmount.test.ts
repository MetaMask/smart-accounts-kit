import { beforeEach, test, expect, describe } from 'vitest';
import {
  encodeExecutionCalldatas,
  encodeDelegations,
  createCaveatBuilder,
  hashDelegation,
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
import { ERC20TransferAmountEnforcer } from '@metamask/smart-accounts-kit/contracts';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  randomAddress,
  deployErc20Token,
  fundAddressWithErc20Token,
  getErc20Balance,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  encodeFunctionData,
  parseEther,
  concat,
  toHex,
  type Address,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let erc20TokenAddress: Address;

/**
 * These tests verify the ERC20 transfer amount caveat functionality.
 *
 * The ERC20 transfer amount caveat ensures that:
 * 1. No more than the specified amount of ERC20 tokens may be transferred
 * 2. Transfers are limited to the specified token contract
 *
 * Alice creates a delegation to Bob with an ERC20 transfer amount caveat.
 * Bob redeems the delegation with ERC20 transfers that must respect the amount limits.
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

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  erc20TokenAddress = (await deployErc20Token()) as Address;
  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress,
    parseEther('100'),
  );
});

const runTest_expectSuccess = async (
  delegator: MetaMaskSmartAccount,
  delegate: Address,
  maxAmount: bigint,
  transferAmount: bigint,
  recipient: string,
) => {
  const { environment } = delegator;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('erc20TransferAmount', {
        tokenAddress: erc20TokenAddress,
        maxAmount,
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

const runTest_expectFailure = async (
  delegator: MetaMaskSmartAccount,
  delegate: Address,
  maxAmount: bigint,
  transferAmount: bigint,
  recipient: string,
  expectedError: string,
) => {
  const { environment } = delegator;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('erc20TransferAmount', {
        tokenAddress: erc20TokenAddress,
        maxAmount,
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

describe('ERC20TransferAmountEnforcer Utilities E2E Tests', () => {
  test('getTermsInfo: Should correctly decode terms from a real delegation', async () => {
    const maxAmount = parseEther('5');
    const enforcerAddress =
      aliceSmartAccount.environment.caveatEnforcers.ERC20TransferAmountEnforcer;

    if (!enforcerAddress) {
      throw new Error('ERC20TransferAmountEnforcer not found in environment');
    }

    // Create delegation with ERC20 transfer amount caveat
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('erc20TransferAmount', {
          tokenAddress: erc20TokenAddress,
          maxAmount,
        })
        .build(),
      signature: '0x',
    };

    // Extract terms from the caveat
    const caveat = delegation.caveats[0];
    if (!caveat) {
      throw new Error('No caveats found in delegation');
    }

    // Test our utility function
    const result = await ERC20TransferAmountEnforcer.read.getTermsInfo({
      client: publicClient,
      contractAddress: enforcerAddress,
      terms: caveat.terms,
    });

    // Verify the decoded terms match our input
    expect(result.allowedContract.toLowerCase()).toBe(
      erc20TokenAddress.toLowerCase(),
    );
    expect(result.maxTokens).toBe(maxAmount);

    // Compare with manual decoding to ensure accuracy
    const expectedTerms = concat([
      erc20TokenAddress,
      toHex(maxAmount, { size: 32 }),
    ]);
    expect(caveat.terms).toBe(expectedTerms);
  });

  test('getSpentAmount: Should track spending correctly before and after transfers', async () => {
    const maxAmount = parseEther('10');
    const transferAmount1 = parseEther('3');
    const transferAmount2 = parseEther('4');
    const recipient = randomAddress();

    const enforcerAddress =
      aliceSmartAccount.environment.caveatEnforcers.ERC20TransferAmountEnforcer;

    if (!enforcerAddress) {
      throw new Error('ERC20TransferAmountEnforcer not found in environment');
    }

    // Create delegation
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('erc20TransferAmount', {
          tokenAddress: erc20TokenAddress,
          maxAmount,
        })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    // Get delegation hash and delegation manager
    const delegationHash = hashDelegation(signedDelegation);
    const delegationManager = aliceSmartAccount.environment.DelegationManager;

    // Check spent amount before any transfers (should be 0)
    let spentAmount = await ERC20TransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager,
      delegationHash,
    });
    expect(spentAmount).toBe(0n);

    // Perform first transfer
    const execution1 = createExecution({
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
        args: [recipient as Address, transferAmount1],
      }),
    });

    const redeemData1 = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [encodeDelegations([signedDelegation])],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([[execution1]]),
      ],
    });

    const userOpHash1 = await sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          data: redeemData1,
        },
      ],
      ...gasPrice,
    });

    const receipt1 = await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash1,
    });
    expectUserOperationToSucceed(receipt1);

    // Check spent amount after first transfer
    spentAmount = await ERC20TransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager,
      delegationHash,
    });
    expect(spentAmount).toBe(transferAmount1);

    // Perform second transfer
    const execution2 = createExecution({
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
        args: [recipient as Address, transferAmount2],
      }),
    });

    const redeemData2 = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [encodeDelegations([signedDelegation])],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([[execution2]]),
      ],
    });

    const userOpHash2 = await sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: bobSmartAccount.address,
          data: redeemData2,
        },
      ],
      ...gasPrice,
    });

    const receipt2 = await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash2,
    });
    expectUserOperationToSucceed(receipt2);

    // Check spent amount after second transfer (should be cumulative)
    spentAmount = await ERC20TransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager,
      delegationHash,
    });
    expect(spentAmount).toBe(transferAmount1 + transferAmount2);

    // Verify the total transferred amount is correct
    const recipientBalance = await getErc20Balance(
      recipient as Address,
      erc20TokenAddress,
    );
    expect(recipientBalance).toBe(transferAmount1 + transferAmount2);
  });

  test('Utility functions work correctly with failed transfers', async () => {
    const maxAmount = parseEther('2');
    const transferAmount = parseEther('5'); // Exceeds limit
    const recipient = randomAddress();

    const enforcerAddress =
      aliceSmartAccount.environment.caveatEnforcers.ERC20TransferAmountEnforcer;

    if (!enforcerAddress) {
      throw new Error('ERC20TransferAmountEnforcer not found in environment');
    }

    // Create delegation
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x1', // Different salt to avoid conflicts
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('erc20TransferAmount', {
          tokenAddress: erc20TokenAddress,
          maxAmount,
        })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    // Get delegation hash and delegation manager
    const delegationHash = hashDelegation(signedDelegation);
    const delegationManager = aliceSmartAccount.environment.DelegationManager;

    // Check spent amount before transfer (should be 0)
    let spentAmount = await ERC20TransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager,
      delegationHash,
    });
    expect(spentAmount).toBe(0n);

    // Verify terms are correctly set
    const caveat = delegation.caveats[0];
    if (!caveat) {
      throw new Error('No caveats found in delegation');
    }

    const termsInfo = await ERC20TransferAmountEnforcer.read.getTermsInfo({
      client: publicClient,
      contractAddress: enforcerAddress,
      terms: caveat.terms,
    });
    expect(termsInfo.allowedContract.toLowerCase()).toBe(
      erc20TokenAddress.toLowerCase(),
    );
    expect(termsInfo.maxTokens).toBe(maxAmount);

    // Attempt transfer that should fail
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

    // This should fail
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
      stringToUnprefixedHex('ERC20TransferAmountEnforcer:allowance-exceeded'),
    );

    // Check spent amount after failed transfer (should still be 0)
    spentAmount = await ERC20TransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager,
      delegationHash,
    });
    expect(spentAmount).toBe(0n);

    // Verify recipient didn't receive any tokens
    const recipientBalance = await getErc20Balance(
      recipient as Address,
      erc20TokenAddress,
    );
    expect(recipientBalance).toBe(0n);
  });

  test('Compare utility with manual contract calls', async () => {
    const maxAmount = parseEther('5');
    const enforcerAddress =
      aliceSmartAccount.environment.caveatEnforcers.ERC20TransferAmountEnforcer;

    if (!enforcerAddress) {
      throw new Error('ERC20TransferAmountEnforcer not found in environment');
    }

    // Create delegation
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x2', // Different salt
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('erc20TransferAmount', {
          tokenAddress: erc20TokenAddress,
          maxAmount,
        })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    const caveat = delegation.caveats[0];
    if (!caveat) {
      throw new Error('No caveats found in delegation');
    }

    const delegationHash = hashDelegation(signedDelegation);
    const delegationManager = aliceSmartAccount.environment.DelegationManager;

    // Test getTermsInfo utility vs manual decoding
    const utilityResult = await ERC20TransferAmountEnforcer.read.getTermsInfo({
      client: publicClient,
      contractAddress: enforcerAddress,
      terms: caveat.terms,
    });

    // Manual decoding for comparison
    const expectedTerms = concat([
      erc20TokenAddress,
      toHex(maxAmount, { size: 32 }),
    ]);

    expect(caveat.terms).toBe(expectedTerms);
    expect(utilityResult.allowedContract.toLowerCase()).toBe(
      erc20TokenAddress.toLowerCase(),
    );
    expect(utilityResult.maxTokens).toBe(maxAmount);

    // Test getSpentAmount utility before any transfers
    const spentAmountUtility =
      await ERC20TransferAmountEnforcer.read.getSpentAmount({
        client: publicClient,
        contractAddress: enforcerAddress,
        delegationManager,
        delegationHash,
      });

    expect(spentAmountUtility).toBe(0n);
  });
});

test('maincase: Bob redeems the delegation with transfer within limit', async () => {
  const recipient = randomAddress();
  const maxAmount = parseEther('5');
  const transferAmount = parseEther('3');

  await runTest_expectSuccess(
    aliceSmartAccount,
    bobSmartAccount.address,
    maxAmount,
    transferAmount,
    recipient,
  );
});

test('Bob attempts to redeem the delegation with transfer exceeding limit', async () => {
  const recipient = randomAddress();
  const maxAmount = parseEther('2');
  const transferAmount = parseEther('3');

  await runTest_expectFailure(
    aliceSmartAccount,
    bobSmartAccount.address,
    maxAmount,
    transferAmount,
    recipient,
    'ERC20TransferAmountEnforcer:allowance-exceeded',
  );
});

test('Scope: Bob redeems the delegation with an allowed transfer amount using erc20TransferAmount scope', async () => {
  const maxAmount = parseEther('2');
  const transferAmount = parseEther('1');
  const recipient = randomAddress();

  await runScopeTest_expectSuccess(maxAmount, transferAmount, recipient);
});

test('Scope: Bob attempts to redeem the delegation exceeding max amount using erc20TransferAmount scope', async () => {
  const maxAmount = parseEther('2');
  const transferAmount = parseEther('3');
  const recipient = randomAddress();

  await runScopeTest_expectFailure(
    maxAmount,
    transferAmount,
    recipient,
    'ERC20TransferAmountEnforcer:allowance-exceeded',
  );
});

const runScopeTest_expectSuccess = async (
  maxAmount: bigint,
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
      type: 'erc20TransferAmount',
      tokenAddress: erc20TokenAddress,
      maxAmount,
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
  maxAmount: bigint,
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
      type: 'erc20TransferAmount',
      tokenAddress: erc20TokenAddress,
      maxAmount,
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
