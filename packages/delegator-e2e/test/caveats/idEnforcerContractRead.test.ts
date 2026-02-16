import { beforeEach, test, expect, describe } from 'vitest';
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
import { IdEnforcer } from '@metamask/smart-accounts-kit/contracts';

import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  deployCounter,
  CounterContract,
  publicClient,
  randomBytes,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  encodeFunctionData,
  hexToBigInt,
  toHex,
  pad,
  type Address,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;
let idEnforcerAddress: Address;

/**
 * These tests verify the IdEnforcer contract read functionality.
 *
 * The IdEnforcer ensures that:
 * 1. Each ID can only be used once per delegator/delegation manager combination
 * 2. getTermsInfo correctly decodes the ID from terms
 * 3. getIsUsed correctly reports whether an ID has been used
 *
 * Alice creates delegations to Bob with ID caveats.
 * We test the contract read methods before and after redemption.
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

  // Get IdEnforcer address from the environment
  idEnforcerAddress = aliceSmartAccount.environment.caveatEnforcers.IdEnforcer;
});

describe('IdEnforcer Contract Read Methods', () => {
  test('getTermsInfo correctly decodes ID from terms', async () => {
    const testCases = [
      { id: 0, expectedId: 0n },
      { id: 123, expectedId: 123n },
      { id: 999, expectedId: 999n },
      { id: 2 ** 32 - 1, expectedId: BigInt(2 ** 32 - 1) }, // Max uint32
    ];

    for (const testCase of testCases) {
      // Create terms with the ID (32 bytes, big-endian)
      const terms = pad(toHex(testCase.id), { size: 32 });

      // Test getTermsInfo
      const decodedId = await IdEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        terms,
      });

      expect(decodedId).toBe(testCase.expectedId);
    }
  });

  test('getIsUsed reports false for unused IDs', async () => {
    const id = 42n;

    const isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id,
    });

    expect(isUsed).toBe(false);
  });

  test('getIsUsed reports false for different delegator combinations', async () => {
    const id = 123n;
    const randomDelegator = '0x1234567890123456789012345678901234567890';

    const isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: randomDelegator,
      id,
    });

    expect(isUsed).toBe(false);
  });

  test('getIsUsed reports true after ID is used in delegation', async () => {
    const id = Math.floor(Math.random() * 2 ** 32);
    const newCount = hexToBigInt(randomBytes(32));

    // Create and redeem delegation with specific ID
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('id', { id })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    // Verify ID is not used before redemption
    let isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id: BigInt(id),
    });
    expect(isUsed).toBe(false);

    // Redeem the delegation
    const calldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount],
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

    // Verify the counter was updated
    const countAfter = await publicClient.readContract({
      address: aliceCounter.address,
      abi: CounterMetadata.abi,
      functionName: 'count',
    });
    expect(countAfter).toEqual(newCount);

    // Verify ID is now marked as used
    isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id: BigInt(id),
    });
    expect(isUsed).toBe(true);
  });

  test('getIsUsed is isolated between different delegators', async () => {
    const id = Math.floor(Math.random() * 2 ** 32);
    const newCount = hexToBigInt(randomBytes(32));

    // Create another smart account for Charlie
    const charlie = privateKeyToAccount(generatePrivateKey());
    const charlieSmartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [charlie.address, [], [], []],
      deploySalt: '0x2',
      signer: { account: charlie },
    });

    // Alice uses the ID
    const aliceDelegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('id', { id })
        .build(),
      signature: '0x',
    };

    const signedAliceDelegation = {
      ...aliceDelegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation: aliceDelegation,
      }),
    };

    // Redeem Alice's delegation
    const calldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount],
    });

    const execution = createExecution({
      target: aliceCounter.address,
      callData: calldata,
    });

    const redeemData = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [[signedAliceDelegation]].map(encodeDelegations),
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

    // Verify Alice's ID is used
    const aliceIsUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id: BigInt(id),
    });
    expect(aliceIsUsed).toBe(true);

    // Verify Charlie's same ID is still available (different delegator)
    const charlieIsUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: charlieSmartAccount.address,
      id: BigInt(id),
    });
    expect(charlieIsUsed).toBe(false);
  });

  test('multiple IDs can be tracked independently', async () => {
    const id1 = Math.floor(Math.random() * 2 ** 16);
    const id2 = id1 + 10000; // Ensure different
    const id3 = id2 + 10000; // Ensure different

    // Check all IDs are initially unused
    const [isUsed1Initial, isUsed2Initial, isUsed3Initial] = await Promise.all([
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id1),
      }),
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id2),
      }),
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id3),
      }),
    ]);

    expect(isUsed1Initial).toBe(false);
    expect(isUsed2Initial).toBe(false);
    expect(isUsed3Initial).toBe(false);

    // Use ID2 in a delegation
    const newCount = hexToBigInt(randomBytes(32));
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('id', { id: id2 })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    const calldata = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount],
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

    // Check final states: only ID2 should be used
    const [isUsed1Final, isUsed2Final, isUsed3Final] = await Promise.all([
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id1),
      }),
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id2),
      }),
      IdEnforcer.read.getIsUsed({
        client: publicClient,
        contractAddress: idEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
        id: BigInt(id3),
      }),
    ]);

    expect(isUsed1Final).toBe(false);
    expect(isUsed2Final).toBe(true);
    expect(isUsed3Final).toBe(false);
  });

  test('second attempt to use same ID fails and getIsUsed remains true', async () => {
    const id = Math.floor(Math.random() * 2 ** 32);
    const newCount1 = hexToBigInt(randomBytes(32));
    const newCount2 = hexToBigInt(randomBytes(32));

    // First delegation with the ID
    const delegation1: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('id', { id })
        .build(),
      signature: '0x',
    };

    const signedDelegation1 = {
      ...delegation1,
      signature: await aliceSmartAccount.signDelegation({
        delegation: delegation1,
      }),
    };

    // Successfully redeem first delegation
    const calldata1 = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount1],
    });

    const execution1 = createExecution({
      target: aliceCounter.address,
      callData: calldata1,
    });

    const redeemData1 = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [[signedDelegation1]].map(encodeDelegations),
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

    // Verify ID is now used
    let isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id: BigInt(id),
    });
    expect(isUsed).toBe(true);

    // Second delegation with same ID (should fail)
    const delegation2: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x1', // Different salt
      caveats: createCaveatBuilder(aliceSmartAccount.environment)
        .addCaveat('id', { id })
        .build(),
      signature: '0x',
    };

    const signedDelegation2 = {
      ...delegation2,
      signature: await aliceSmartAccount.signDelegation({
        delegation: delegation2,
      }),
    };

    const calldata2 = encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount2],
    });

    const execution2 = createExecution({
      target: aliceCounter.address,
      callData: calldata2,
    });

    const redeemData2 = encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [[signedDelegation2]].map(encodeDelegations),
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([[execution2]]),
      ],
    });

    // Attempt to redeem second delegation should fail
    await expect(
      sponsoredBundlerClient.sendUserOperation({
        account: bobSmartAccount,
        calls: [
          {
            to: bobSmartAccount.address,
            data: redeemData2,
          },
        ],
        ...gasPrice,
      }),
    ).rejects.toThrow(stringToUnprefixedHex('IdEnforcer:id-already-used'));

    // Verify the counter was not updated with newCount2
    const countAfter = await publicClient.readContract({
      address: aliceCounter.address,
      abi: CounterMetadata.abi,
      functionName: 'count',
    });
    expect(countAfter).not.toEqual(newCount2);
    expect(countAfter).toEqual(newCount1); // Should still be the first value

    // Verify ID is still marked as used
    isUsed = await IdEnforcer.read.getIsUsed({
      client: publicClient,
      contractAddress: idEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
      id: BigInt(id),
    });
    expect(isUsed).toBe(true);
  });
});
