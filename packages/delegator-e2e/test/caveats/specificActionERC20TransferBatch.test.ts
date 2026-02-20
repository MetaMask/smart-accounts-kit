import { beforeEach, test, expect, describe } from 'vitest';
import {
  encodeExecutionCalldatas,
  encodeDelegations,
  createCaveatBuilder,
  hashDelegation,
} from '@metamask/smart-accounts-kit/utils';
import {
  Implementation,
  toMetaMaskSmartAccount,
  ExecutionMode,
  type ExecutionStruct,
  type MetaMaskSmartAccount,
  ROOT_AUTHORITY,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { SpecificActionERC20TransferBatchEnforcer } from '@metamask/smart-accounts-kit/contracts';
import {
  encodeFunctionData,
  type Hex,
  parseEther,
  concat,
  toHex,
  type Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  deployErc20Token,
  getErc20Balance,
  fundAddressWithErc20Token,
  stringToUnprefixedHex,
  publicClient,
} from '../utils/helpers';
import { expectUserOperationToSucceed } from '../utils/assertions';
import CounterMetadata from '../utils/counter/metadata.json';
import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';
const { abi: erc20TokenAbi } = ERC20Token;

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;
let erc20TokenAddress: Hex;
let specificActionERC20TransferBatchEnforcerAddress: Address;

/**
 * These tests verify the specific action ERC20 transfer batch caveat functionality.
 *
 * The specific action ERC20 transfer batch caveat ensures that:
 * 1. The first transaction matches exactly with the specified target, method and calldata
 * 2. The second transaction is an ERC20 transfer with specific parameters (token, recipient, amount)
 * 3. The delegation can only be executed once
 *
 * Alice creates a delegation to Bob with a specific action ERC20 transfer batch caveat.
 * Bob redeems the delegation with a batch of two transactions that must match exactly.
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

  aliceCounter = await deployCounter(aliceSmartAccount.address);
  erc20TokenAddress = await deployErc20Token();
  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress,
    parseEther('10'),
  );

  // Get SpecificActionERC20TransferBatchEnforcer address from the environment
  specificActionERC20TransferBatchEnforcerAddress =
    aliceSmartAccount.environment.caveatEnforcers
      .SpecificActionERC20TransferBatchEnforcer;
});

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  tokenAddress: Hex,
  recipient: Hex,
  amount: bigint,
  target: Hex,
  calldata: Hex,
  executions: ExecutionStruct[],
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('specificActionERC20TransferBatch', {
        tokenAddress,
        recipient,
        amount,
        target,
        calldata,
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
      [ExecutionMode.BatchDefault],
      encodeExecutionCalldatas([executions]),
    ],
  });

  const recipientBalanceBefore = await getErc20Balance(recipient, tokenAddress);

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

  const recipientBalanceAfter = await getErc20Balance(recipient, tokenAddress);
  expect(recipientBalanceAfter - recipientBalanceBefore).toBe(amount);
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  tokenAddress: Hex,
  recipient: Hex,
  amount: bigint,
  target: Hex,
  calldata: Hex,
  executions: {
    target: Hex;
    value: bigint;
    callData: Hex;
  }[],
  expectedError: string,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('specificActionERC20TransferBatch', {
        tokenAddress,
        recipient,
        amount,
        target,
        calldata,
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
      [ExecutionMode.BatchDefault],
      encodeExecutionCalldatas([executions]),
    ],
  });

  const recipientBalanceBefore = await getErc20Balance(recipient, tokenAddress);

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

  const recipientBalanceAfter = await getErc20Balance(recipient, tokenAddress);
  expect(recipientBalanceAfter - recipientBalanceBefore).toBe(0n);
};

test('maincase: Bob redeems the delegation with matching batch executions', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, transferAmount],
      }),
    },
  ];

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
  );
});

test('Bob attempts to redeem the delegation with mismatched first target', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');

  const executions = [
    {
      target: erc20TokenAddress, // Wrong target
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, transferAmount],
      }),
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-first-transaction',
  );
});

test('Bob attempts to redeem the delegation with mismatched first calldata', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const wrongCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'setCount',
    args: [42n],
  });

  const transferAmount = parseEther('5');

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: wrongCalldata, // Wrong calldata
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, transferAmount],
      }),
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-first-transaction',
  );
});

test('Bob attempts to redeem the delegation with mismatched token address', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');
  const wrongTokenAddress = aliceCounter.address as Hex; // Using counter as wrong token

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: wrongTokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, transferAmount],
      }),
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-second-transaction',
  );
});

test('Bob attempts to redeem the delegation with mismatched recipient', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');
  const wrongRecipient = aliceSmartAccount.address; // Using Alice as wrong recipient

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [wrongRecipient, transferAmount],
      }),
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-second-transaction',
  );
});

test('Bob attempts to redeem the delegation with mismatched amount', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');
  const wrongAmount = parseEther('6'); // Different amount

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, wrongAmount],
      }),
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-second-transaction',
  );
});

test('Bob attempts to redeem the delegation with wrong number of executions', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
  ];

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:invalid-batch-size',
  );
});

test('Bob attempts to redeem the delegation twice', async () => {
  const incrementCalldata = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const transferAmount = parseEther('5');

  const executions = [
    {
      target: aliceCounter.address,
      value: 0n,
      callData: incrementCalldata,
    },
    {
      target: erc20TokenAddress,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [bobSmartAccount.address, transferAmount],
      }),
    },
  ];

  // First redemption should succeed
  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
  );

  // Second redemption should fail
  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    erc20TokenAddress,
    bobSmartAccount.address,
    transferAmount,
    aliceCounter.address,
    incrementCalldata,
    executions,
    'SpecificActionERC20TransferBatchEnforcer:delegation-already-used',
  );
});

describe('SpecificActionERC20TransferBatchEnforcer Contract Read Methods', () => {
  test('getTermsInfo correctly decodes terms from encoded data', async () => {
    const tokenAddress = erc20TokenAddress;
    const recipient = bobSmartAccount.address;
    const amount = parseEther('2.5');
    const firstTarget = aliceCounter.address;
    const firstCalldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'increment',
    });

    // Encode terms: tokenAddress (20) + recipient (20) + amount (32) + firstTarget (20) + firstCalldata
    const terms = concat([
      tokenAddress,
      recipient,
      toHex(amount, { size: 32 }),
      firstTarget,
      firstCalldata,
    ]);

    const result =
      await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        terms,
      });

    expect(result.tokenAddress.toLowerCase()).toBe(tokenAddress.toLowerCase());
    expect(result.recipient.toLowerCase()).toBe(recipient.toLowerCase());
    expect(result.amount).toBe(amount);
    expect(result.firstTarget.toLowerCase()).toBe(firstTarget.toLowerCase());
    expect(result.firstCalldata).toBe(firstCalldata);
  });

  test('getTermsInfo handles empty calldata correctly', async () => {
    const tokenAddress = erc20TokenAddress;
    const recipient = bobSmartAccount.address;
    const amount = parseEther('1.0');
    const firstTarget = aliceCounter.address;
    const firstCalldata = '0x' as Hex; // Empty calldata

    const terms = concat([
      tokenAddress,
      recipient,
      toHex(amount, { size: 32 }),
      firstTarget,
      firstCalldata,
    ]);

    const result =
      await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        terms,
      });

    expect(result.tokenAddress.toLowerCase()).toBe(tokenAddress.toLowerCase());
    expect(result.recipient.toLowerCase()).toBe(recipient.toLowerCase());
    expect(result.amount).toBe(amount);
    expect(result.firstTarget.toLowerCase()).toBe(firstTarget.toLowerCase());
    expect(result.firstCalldata).toBe('0x');
  });

  test('getTermsInfo handles complex calldata correctly', async () => {
    const tokenAddress = erc20TokenAddress;
    const recipient = bobSmartAccount.address;
    const amount = parseEther('0.5');
    const firstTarget = aliceCounter.address;
    const firstCalldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [42n],
    });

    const terms = concat([
      tokenAddress,
      recipient,
      toHex(amount, { size: 32 }),
      firstTarget,
      firstCalldata,
    ]);

    const result =
      await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        terms,
      });

    expect(result.tokenAddress.toLowerCase()).toBe(tokenAddress.toLowerCase());
    expect(result.recipient.toLowerCase()).toBe(recipient.toLowerCase());
    expect(result.amount).toBe(amount);
    expect(result.firstTarget.toLowerCase()).toBe(firstTarget.toLowerCase());
    expect(result.firstCalldata).toBe(firstCalldata);
  });

  test('usedDelegations returns false for unused delegation', async () => {
    const { environment } = aliceSmartAccount;

    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x123',
      caveats: createCaveatBuilder(environment)
        .addCaveat('specificActionERC20TransferBatch', {
          tokenAddress: erc20TokenAddress,
          recipient: bobSmartAccount.address,
          amount: parseEther('1'),
          target: aliceCounter.address,
          calldata: '0x1234',
        })
        .build(),
      signature: '0x',
    };

    const delegationHash = hashDelegation(delegation);

    const isUsed =
      await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash,
      });

    expect(isUsed).toBe(false);
  });

  test('usedDelegations returns true after delegation execution', async () => {
    const { environment } = aliceSmartAccount;
    const transferAmount = parseEther('1');
    const incrementCalldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'increment',
    });

    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x456',
      caveats: createCaveatBuilder(environment)
        .addCaveat('specificActionERC20TransferBatch', {
          tokenAddress: erc20TokenAddress,
          recipient: bobSmartAccount.address,
          amount: transferAmount,
          target: aliceCounter.address,
          calldata: incrementCalldata,
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

    const executions = [
      {
        target: aliceCounter.address,
        value: 0n,
        callData: incrementCalldata,
      },
      {
        target: erc20TokenAddress,
        value: 0n,
        callData: encodeFunctionData({
          abi: erc20TokenAbi,
          functionName: 'transfer',
          args: [bobSmartAccount.address, transferAmount],
        }),
      },
    ];

    const delegationHash = hashDelegation(delegation);

    // Check that delegation is unused before execution
    let isUsed =
      await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash,
      });
    expect(isUsed).toBe(false);

    // Execute the delegation
    const redeemData = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [encodeDelegations([signedDelegation])],
        [ExecutionMode.BatchDefault],
        encodeExecutionCalldatas([executions]),
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

    await expectUserOperationToSucceed(receipt);

    // Check that delegation is now used
    isUsed =
      await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash,
      });
    expect(isUsed).toBe(true);
  });

  test('usedDelegations correctly isolates between different delegations', async () => {
    const { environment } = aliceSmartAccount;

    // Create two different delegations with different salts
    const delegation1: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x111',
      caveats: createCaveatBuilder(environment)
        .addCaveat('specificActionERC20TransferBatch', {
          tokenAddress: erc20TokenAddress,
          recipient: bobSmartAccount.address,
          amount: parseEther('1'),
          target: aliceCounter.address,
          calldata: '0x1234',
        })
        .build(),
      signature: '0x',
    };

    const delegation2: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x222', // Different salt = different delegation hash
      caveats: createCaveatBuilder(environment)
        .addCaveat('specificActionERC20TransferBatch', {
          tokenAddress: erc20TokenAddress,
          recipient: bobSmartAccount.address,
          amount: parseEther('1'),
          target: aliceCounter.address,
          calldata: '0x1234',
        })
        .build(),
      signature: '0x',
    };

    const delegationHash1 = hashDelegation(delegation1);
    const delegationHash2 = hashDelegation(delegation2);

    // Both delegations should be unused initially
    const isUsed1 =
      await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash: delegationHash1,
      });

    const isUsed2 =
      await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash: delegationHash2,
      });

    expect(isUsed1).toBe(false);
    expect(isUsed2).toBe(false);
    expect(delegationHash1).not.toBe(delegationHash2); // Verify they're different
  });

  test('getTermsInfo handles edge case with minimal terms data', async () => {
    const tokenAddress = erc20TokenAddress;
    const recipient = bobSmartAccount.address;
    const amount = 0n; // Zero amount
    const firstTarget = aliceCounter.address;
    const firstCalldata = '0x' as Hex; // Minimal calldata

    const terms = concat([
      tokenAddress,
      recipient,
      toHex(amount, { size: 32 }),
      firstTarget,
      firstCalldata,
    ]);

    const result =
      await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: specificActionERC20TransferBatchEnforcerAddress,
        terms,
      });

    expect(result.tokenAddress.toLowerCase()).toBe(tokenAddress.toLowerCase());
    expect(result.recipient.toLowerCase()).toBe(recipient.toLowerCase());
    expect(result.amount).toBe(0n);
    expect(result.firstTarget.toLowerCase()).toBe(firstTarget.toLowerCase());
    expect(result.firstCalldata).toBe('0x');
  });
});
