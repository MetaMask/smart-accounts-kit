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
  getDelegationHashOffchain,
} from '@metamask/smart-accounts-kit/utils';
import { LimitedCallsEnforcer } from '@metamask/smart-accounts-kit/contracts';

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
import { encodeFunctionData, hexToBigInt, toHex, type Address } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import CounterMetadata from '../utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;
let limitedCallsEnforcerAddress: Address;

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

  // Get LimitedCallsEnforcer address from the environment
  limitedCallsEnforcerAddress =
    aliceSmartAccount.environment.caveatEnforcers.LimitedCallsEnforcer;
});

test('maincase: Bob redeems the delegation the allowed number of calls', async () => {
  const limit = 3;

  await runTest_expectSuccess(limit, limit);
});

test('Bob redeems the delegation less than the allowed number of calls', async () => {
  const limit = 3;

  await runTest_expectSuccess(limit, limit - 1);
});

test('Bob attempts to redeem the delegation more than the allowed limit', async () => {
  const limit = 3;
  const runs = limit + 1;

  await runTest_expectFailure(
    limit,
    runs,
    'LimitedCallsEnforcer:limit-exceeded',
  );
});

const runTest_expectSuccess = async (limit: number, runs: number) => {
  return runTest(limit, runs);
};

const runTest_expectFailure = async (
  limit: number,
  runs: number,
  expectedError: string,
) => {
  await expect(runTest(limit, runs)).rejects.toThrow(
    stringToUnprefixedHex(expectedError),
  );
};

const runTest = async (limit: number, runs: number) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('limitedCalls', { limit })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  for (let i = 0; i < runs; i++) {
    const newCount = hexToBigInt(randomBytes(32));
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

    const countAfter = await publicClient.readContract({
      address: aliceCounter.address,
      abi: CounterMetadata.abi,
      functionName: 'count',
    });

    expect(countAfter).toEqual(newCount);
  }
};

describe('LimitedCallsEnforcer Contract Read Methods', () => {
  test('getTermsInfo correctly decodes limit from terms', async () => {
    const testCases = [
      { limit: 0n, terms: toHex(0n, { size: 32 }) },
      { limit: 1n, terms: toHex(1n, { size: 32 }) },
      { limit: 5n, terms: toHex(5n, { size: 32 }) },
      { limit: 100n, terms: toHex(100n, { size: 32 }) },
      { limit: 2n ** 32n - 1n, terms: toHex(2n ** 32n - 1n, { size: 32 }) }, // Max uint32
    ];

    for (const { limit, terms } of testCases) {
      const decodedLimit = await LimitedCallsEnforcer.read.getTermsInfo({
        client: publicClient,
        contractAddress: limitedCallsEnforcerAddress,
        terms,
      });
      expect(decodedLimit).toEqual(limit);
    }
  });

  test('callCounts returns 0 for an unused delegation', async () => {
    const limit = 5;
    const { environment } = aliceSmartAccount;

    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(environment)
        .addCaveat('limitedCalls', { limit })
        .build(),
      signature: '0x',
    };

    // Calculate delegation hash
    const delegationHash = getDelegationHashOffchain(delegation);

    const callCount = await LimitedCallsEnforcer.read.callCounts({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash,
    });

    expect(callCount).toBe(0n);
  });

  test('callCounts increases after each delegation redemption', async () => {
    const limit = 3;
    const { environment } = aliceSmartAccount;

    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x0',
      caveats: createCaveatBuilder(environment)
        .addCaveat('limitedCalls', { limit })
        .build(),
      signature: '0x',
    };

    const signedDelegation = {
      ...delegation,
      signature: await aliceSmartAccount.signDelegation({
        delegation,
      }),
    };

    // Calculate delegation hash
    const delegationHash = getDelegationHashOffchain(delegation);

    // Check initial call count
    let callCount = await LimitedCallsEnforcer.read.callCounts({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash,
    });
    expect(callCount).toBe(0n);

    // Redeem delegation multiple times and check call count after each
    for (let i = 1; i <= limit; i++) {
      const newCount = hexToBigInt(randomBytes(32));
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

      // Check that call count increased
      callCount = await LimitedCallsEnforcer.read.callCounts({
        client: publicClient,
        contractAddress: limitedCallsEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegationHash,
      });
      expect(callCount).toBe(BigInt(i));
    }
  });

  test('callCounts is isolated per delegation hash', async () => {
    const limit = 3;
    const { environment } = aliceSmartAccount;

    // Create two different delegations with different salts
    const delegation1: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x1',
      caveats: createCaveatBuilder(environment)
        .addCaveat('limitedCalls', { limit })
        .build(),
      signature: '0x',
    };

    const delegation2: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x2',
      caveats: createCaveatBuilder(environment)
        .addCaveat('limitedCalls', { limit })
        .build(),
      signature: '0x',
    };

    const signedDelegation1 = {
      ...delegation1,
      signature: await aliceSmartAccount.signDelegation({
        delegation: delegation1,
      }),
    };

    // Calculate delegation hashes
    const delegationHash1 = getDelegationHashOffchain(delegation1);
    const delegationHash2 = getDelegationHashOffchain(delegation2);

    // Redeem delegation1 once
    const newCount = hexToBigInt(randomBytes(32));
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
        [[signedDelegation1]].map(encodeDelegations),
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

    await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    // Check call counts - delegation1 should have 1, delegation2 should have 0
    const callCount1 = await LimitedCallsEnforcer.read.callCounts({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash: delegationHash1,
    });
    expect(callCount1).toBe(1n);

    const callCount2 = await LimitedCallsEnforcer.read.callCounts({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash: delegationHash2,
    });
    expect(callCount2).toBe(0n);
  });

  test('getTermsInfo and callCounts utility functions work with real delegation data', async () => {
    const limit = 5;
    const { environment } = aliceSmartAccount;

    // Create a real delegation
    const delegation: Delegation = {
      delegate: bobSmartAccount.address,
      delegator: aliceSmartAccount.address,
      authority: ROOT_AUTHORITY,
      salt: '0x42',
      caveats: createCaveatBuilder(environment)
        .addCaveat('limitedCalls', { limit })
        .build(),
      signature: '0x',
    };

    // Extract terms from the caveat
    const caveat = delegation.caveats[0];
    if (!caveat) {
      throw new Error('No caveats found in delegation');
    }

    // Test getTermsInfo with real caveat terms
    const decodedLimit = await LimitedCallsEnforcer.read.getTermsInfo({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      terms: caveat.terms,
    });
    expect(decodedLimit).toBe(BigInt(limit));

    // Calculate delegation hash
    const delegationHash = getDelegationHashOffchain(delegation);

    // Test callCounts with real delegation hash
    const initialCallCount = await LimitedCallsEnforcer.read.callCounts({
      client: publicClient,
      contractAddress: limitedCallsEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegationHash,
    });
    expect(initialCallCount).toBe(0n);
  });
});
