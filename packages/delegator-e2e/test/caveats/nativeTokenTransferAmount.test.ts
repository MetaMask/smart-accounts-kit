import { beforeEach, test, expect } from 'vitest';
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
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  fundAddress,
  stringToUnprefixedHex,
  deployPayableReceiver,
  getPayableReceiverBalance,
  getPayableReceiverTotalReceived,
  encodeReceiveEthCalldata,
  encodeReceiveEthAlternativeCalldata,
  randomAddress,
} from '../utils/helpers';
import { encodeFunctionData, parseEther, type Hex } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { NativeTokenTransferAmountEnforcer } from '@metamask/smart-accounts-kit/contracts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let payableReceiverAddress: Hex;

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
  await fundAddress(aliceSmartAccount.address, parseEther('2'));

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: bob },
  });

  // Deploy PayableReceiver contract for calldata testing
  payableReceiverAddress = await deployPayableReceiver();
});

test('maincase: Bob redeems the delegation with an allowed amount', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');

  await runTest_expectSuccess(allowance, transferAmount);
});

test('Bob attempts to redeem the delegation with an amount exceeding the allowance', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('1.5');

  await runTest_expectFailure(
    allowance,
    transferAmount,
    'NativeTokenTransferAmountEnforcer:allowance-exceeded',
  );
});

test('Bob redeems the delegation with the exact allowed amount', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('1');

  await runTest_expectSuccess(allowance, transferAmount);
});

const runTest_expectSuccess = async (
  allowance: bigint,
  transferAmount: bigint,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
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

  expect(
    balanceAfter - balanceBefore,
    'Expected balance to increase by transfer amount',
  ).toEqual(transferAmount);
};

const runTest_expectFailure = async (
  allowance: bigint,
  transferAmount: bigint,
  expectedError: string,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
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

  const balanceAfter = await publicClient.getBalance({
    address: bobAddress,
  });
  expect(balanceAfter, 'Expected balance to remain unchanged').toEqual(
    balanceBefore,
  );
};

test('Scope: Bob redeems the delegation with an allowed amount using nativeTokenTransferAmount scope', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');

  await runScopeTest_expectSuccess(allowance, transferAmount);
});

test('Scope: Bob attempts to redeem the delegation with an amount exceeding the allowance using nativeTokenTransferAmount scope', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('1.5');

  await runScopeTest_expectFailure(
    allowance,
    transferAmount,
    'NativeTokenTransferAmountEnforcer:allowance-exceeded',
  );
});

const runScopeTest_expectSuccess = async (
  allowance: bigint,
  transferAmount: bigint,
) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobAddress,
    from: aliceAddress,
    scope: {
      type: 'nativeTokenTransferAmount',
      maxAmount: allowance,
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

  expect(
    balanceAfter - balanceBefore,
    'Expected balance to increase by transfer amount',
  ).toEqual(transferAmount);
};

const runScopeTest_expectFailure = async (
  allowance: bigint,
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
      type: 'nativeTokenTransferAmount',
      maxAmount: allowance,
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

  const balanceAfter = await publicClient.getBalance({
    address: bobAddress,
  });
  expect(balanceAfter, 'Expected balance to remain unchanged').toEqual(
    balanceBefore,
  );
};

test('Utility: getTermsInfo should correctly decode terms from a real delegation', async () => {
  const maxAmount = parseEther('1'); // 1 ETH allowance

  // Create a delegation with native token transfer amount enforcer
  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', {
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

  // Get the enforcer address from the environment
  const enforcerAddress =
    aliceSmartAccount.environment.caveatEnforcers
      .NativeTokenTransferAmountEnforcer;
  if (!enforcerAddress) {
    throw new Error(
      'NativeTokenTransferAmountEnforcer not found in environment',
    );
  }

  // Test our utility function
  const result = await NativeTokenTransferAmountEnforcer.read.getTermsInfo({
    client: publicClient,
    contractAddress: enforcerAddress,
    terms: caveat.terms,
  });

  // Verify the decoded terms match our input
  expect(result).toBe(maxAmount);

  // Also test that the utility matches manual contract call
  const manualResult = await publicClient.readContract({
    address: enforcerAddress,
    abi: [
      {
        inputs: [{ name: '_terms', type: 'bytes' }],
        name: 'getTermsInfo',
        outputs: [{ name: 'allowance_', type: 'uint256' }],
        stateMutability: 'pure',
        type: 'function',
      },
    ],
    functionName: 'getTermsInfo',
    args: [caveat.terms],
  });

  expect(result).toBe(manualResult);
});

test('Utility: getSpentAmount should track spending correctly before and after transfers', async () => {
  const maxAmount = parseEther('2');
  const transferAmount = parseEther('0.5');

  const enforcerAddress =
    aliceSmartAccount.environment.caveatEnforcers
      .NativeTokenTransferAmountEnforcer!;

  // Create delegation using EXACT same pattern as working runTest_expectSuccess
  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const delegationHash = hashDelegation(signedDelegation);

  // Check initial spent amount
  const initialSpent =
    await NativeTokenTransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash,
    });

  expect(initialSpent).toBe(0n);

  // Check Bob's balance before (like working tests do)
  const balanceBefore = await publicClient.getBalance({
    address: bobSmartAccount.address,
  });

  // Use EXACT same execution pattern as working tests
  const execution = createExecution({
    target: bobSmartAccount.address,
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

  // Execute exactly like working tests
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

  // Verify the transfer actually happened (like working tests)
  const balanceAfter = await publicClient.getBalance({
    address: bobSmartAccount.address,
  });

  expect(
    balanceAfter - balanceBefore,
    'Expected balance to increase by transfer amount',
  ).toEqual(transferAmount);

  // Now check if enforcer tracked the spending
  const spentAfterTransfer =
    await NativeTokenTransferAmountEnforcer.read.getSpentAmount({
      client: publicClient,
      contractAddress: enforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash,
    });

  // Verify with direct contract call using hardcoded ABI
  const manualSpentResult = await publicClient.readContract({
    address: enforcerAddress,
    abi: [
      {
        type: 'function',
        name: 'spentMap',
        inputs: [
          { name: 'delegationManager', type: 'address' },
          { name: 'delegationHash', type: 'bytes32' },
        ],
        outputs: [{ name: 'amount', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'spentMap',
    args: [aliceSmartAccount.environment.DelegationManager, delegationHash],
  });

  expect(spentAfterTransfer).toBe(transferAmount);
  expect(spentAfterTransfer).toBe(manualSpentResult);
});

test('Caveat with exactCalldata: Bob successfully redeems with exact calldata match', async () => {
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');
  const exactCalldata = encodeReceiveEthCalldata(); // Use real contract function calldata

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
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
    target: payableReceiverAddress, // Call the PayableReceiver contract
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
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');
  const exactCalldata = encodeReceiveEthCalldata(); // Expect receiveEth() calldata
  const wrongCalldata = encodeReceiveEthAlternativeCalldata(); // Use receiveEthAlternative() calldata

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
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
    target: payableReceiverAddress, // Call the PayableReceiver contract
    value: transferAmount,
    callData: wrongCalldata, // Wrong calldata - different function
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
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');
  const allowedCalldata = encodeReceiveEthCalldata();

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
      .addCaveat('allowedCalldata', { startIndex: 0, value: allowedCalldata })
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
    target: payableReceiverAddress, // Call the PayableReceiver contract
    value: transferAmount,
    callData: allowedCalldata, // Matches allowed calldata
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
  const allowance = parseEther('1');
  const transferAmount = parseEther('0.5');
  const allowedCalldata = encodeReceiveEthCalldata(); // Only allow receiveEth() calldata
  const disallowedCalldata = encodeReceiveEthAlternativeCalldata(); // Try receiveEthAlternative() calldata

  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('nativeTokenTransferAmount', { maxAmount: allowance })
      .addCaveat('allowedCalldata', { startIndex: 0, value: allowedCalldata })
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
    target: payableReceiverAddress, // Call the PayableReceiver contract
    value: transferAmount,
    callData: disallowedCalldata, // Different function from allowed calldata
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
