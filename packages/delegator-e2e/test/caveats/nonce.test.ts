import { beforeEach, test, expect, describe } from 'vitest';
import { NonceEnforcer } from '@metamask/delegation-abis';
import {
  createExecution,
  ExecutionMode,
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
  ROOT_AUTHORITY,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeExecutionCalldatas,
  encodePermissionContexts,
} from '@metamask/smart-accounts-kit/utils';
import { NonceEnforcer as NonceEnforcerUtils } from '@metamask/smart-accounts-kit/contracts';
import {
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  randomBytes,
  fundAddress,
  deployCounter,
  CounterContract,
  publicClient,
  stringToUnprefixedHex,
} from '../utils/helpers';
import CounterMetadata from '../utils/counter/metadata.json';

import { type Address, encodeFunctionData, parseEther, toHex } from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let aliceCounter: CounterContract;
let nonceEnforcerAddress: Address;

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

  aliceCounter = await deployCounter(aliceSmartAccount.address);

  // Get NonceEnforcer address from the environment
  nonceEnforcerAddress =
    aliceSmartAccount.environment.caveatEnforcers.NonceEnforcer;
});

test('maincase: Bob redeems the delegation with a nonce of 0', async () => {
  const newCount = BigInt(randomBytes(32));
  const nonce = 0n;
  await runTest_expectSuccess(newCount, nonce);
});

test('Bob attempts to redeem the delegation with a nonce of 1', async () => {
  const newCount = BigInt(randomBytes(32));
  const nonce = 1n;
  await runTest_expectFailure(newCount, nonce, 'NonceEnforcer:invalid-nonce');
});

test('Bob redeems a delegation with nonce 1 after alice increments the nonce', async () => {
  const newCount = BigInt(randomBytes(32));
  const nonce = 1n;

  await runTest_expectFailure(newCount, nonce, 'NonceEnforcer:invalid-nonce');

  await incrementNonce();

  await runTest_expectSuccess(newCount, nonce);
});

test('Bob redeems a delegation with nonce 4 after alice increments the nonce 4 times', async () => {
  const newCount = BigInt(randomBytes(32));
  const nonce = 4n;

  for (let i = 0; i < 4; i++) {
    await runTest_expectFailure(newCount, nonce, 'NonceEnforcer:invalid-nonce');
    await incrementNonce();
  }

  await runTest_expectSuccess(newCount, nonce);
});

test('Bob attempts to redeem a delegation with a nonce of 0 after alice increments the nonce', async () => {
  const newCount = BigInt(randomBytes(32));
  const nonce = 0n;

  await incrementNonce();

  await runTest_expectFailure(newCount, nonce, 'NonceEnforcer:invalid-nonce');
});

const runTest_expectSuccess = async (newCount: bigint, nonce: bigint) => {
  const bobAddress = bobSmartAccount.address;
  const aliceAddress = aliceSmartAccount.address;

  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate: bobAddress,
    delegator: aliceAddress,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('nonce', { nonce: toHex(nonce) })
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
    target: aliceCounter.address,
    callData: encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount],
    }),
  });

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      encodePermissionContexts([[signedDelegation]]),
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
  expect(countAfter, `Expected final count to be ${newCount}`).toEqual(
    newCount,
  );
};

const runTest_expectFailure = async (
  newCount: bigint,
  nonce: bigint,
  expectedError: string,
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
      .addCaveat('nonce', { nonce: toHex(nonce) })
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
    target: aliceCounter.address,
    callData: encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'setCount',
      args: [newCount],
    }),
  });

  const redeemData = encodeFunctionData({
    abi: bobSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      encodePermissionContexts([[signedDelegation]]),
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

  const countAfter = await publicClient.readContract({
    address: aliceCounter.address,
    abi: CounterMetadata.abi,
    functionName: 'count',
  });
  expect(countAfter, 'Expected count to remain 0n').toEqual(0n);
};

const incrementNonce = async () => {
  const { environment } = aliceSmartAccount;

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: environment.caveatEnforcers.NonceEnforcer!,
        data: encodeFunctionData({
          abi: NonceEnforcer,
          functionName: 'incrementNonce',
          args: [environment.DelegationManager],
        }),
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);
};

describe('NonceEnforcer Contract Read Methods', () => {
  test('getTermsInfo correctly decodes nonce from terms', async () => {
    const testCases = [
      { nonce: 0n, terms: toHex(0n, { size: 32 }) },
      { nonce: 1n, terms: toHex(1n, { size: 32 }) },
      { nonce: 5n, terms: toHex(5n, { size: 32 }) },
      { nonce: 100n, terms: toHex(100n, { size: 32 }) },
      { nonce: 2n ** 32n - 1n, terms: toHex(2n ** 32n - 1n, { size: 32 }) }, // Max uint32
      { nonce: 2n ** 255n - 1n, terms: toHex(2n ** 255n - 1n, { size: 32 }) }, // Max uint256
    ];

    for (const { nonce, terms } of testCases) {
      const decodedNonce = await NonceEnforcerUtils.read.getTermsInfo({
        client: publicClient,
        contractAddress: nonceEnforcerAddress,
        terms,
      });
      expect(decodedNonce).toEqual(nonce);
    }
  });

  test('currentNonce returns 0 for a new delegator', async () => {
    const currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });

    expect(currentNonce).toBe(0n);
  });

  test('currentNonce increases after calling incrementNonce', async () => {
    // Check initial nonce is 0
    let currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(0n);

    // Increment nonce once
    await incrementNonce();

    // Check nonce is now 1
    currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(1n);

    // Increment nonce again
    await incrementNonce();

    // Check nonce is now 2
    currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(2n);
  });

  test('currentNonce is isolated per delegator', async () => {
    // Create a third account (Charlie)
    const charlie = privateKeyToAccount(generatePrivateKey());
    const charlieSmartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [charlie.address, [], [], []],
      deploySalt: '0x2',
      signer: { account: charlie },
    });
    await deploySmartAccount(charlieSmartAccount);
    await fundAddress(charlieSmartAccount.address, parseEther('2'));

    // Check both accounts start with nonce 0
    let aliceNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    let charlieNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: charlieSmartAccount.environment.DelegationManager,
      delegator: charlieSmartAccount.address,
    });
    expect(aliceNonce).toBe(0n);
    expect(charlieNonce).toBe(0n);

    // Increment Alice's nonce
    await incrementNonce();

    // Check Alice's nonce increased but Charlie's didn't
    aliceNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    charlieNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: charlieSmartAccount.environment.DelegationManager,
      delegator: charlieSmartAccount.address,
    });
    expect(aliceNonce).toBe(1n);
    expect(charlieNonce).toBe(0n);

    // Increment Charlie's nonce using his account
    const charlieIncrementUserOpHash =
      await sponsoredBundlerClient.sendUserOperation({
        account: charlieSmartAccount,
        calls: [
          {
            to: charlieSmartAccount.environment.caveatEnforcers.NonceEnforcer!,
            data: encodeFunctionData({
              abi: NonceEnforcer,
              functionName: 'incrementNonce',
              args: [charlieSmartAccount.environment.DelegationManager],
            }),
          },
        ],
        ...gasPrice,
      });

    const charlieIncrementReceipt =
      await sponsoredBundlerClient.waitForUserOperationReceipt({
        hash: charlieIncrementUserOpHash,
      });
    expectUserOperationToSucceed(charlieIncrementReceipt);

    // Check both nonces are now 1
    aliceNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    charlieNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: charlieSmartAccount.environment.DelegationManager,
      delegator: charlieSmartAccount.address,
    });
    expect(aliceNonce).toBe(1n);
    expect(charlieNonce).toBe(1n);
  });

  test('getTermsInfo handles edge cases correctly', async () => {
    // Test empty terms (should fail)
    await expect(
      NonceEnforcerUtils.read.getTermsInfo({
        client: publicClient,
        contractAddress: nonceEnforcerAddress,
        terms: '0x',
      }),
    ).rejects.toThrow();

    // Test short terms (should fail)
    await expect(
      NonceEnforcerUtils.read.getTermsInfo({
        client: publicClient,
        contractAddress: nonceEnforcerAddress,
        terms: '0x1234',
      }),
    ).rejects.toThrow();

    // Test terms that are too long (should fail)
    await expect(
      NonceEnforcerUtils.read.getTermsInfo({
        client: publicClient,
        contractAddress: nonceEnforcerAddress,
        terms: toHex(0n, { size: 64 }), // 64 bytes instead of 32
      }),
    ).rejects.toThrow();
  });

  test('encode function produces correct calldata for incrementNonce', async () => {
    // Test the encode utility function
    const expectedCalldata = encodeFunctionData({
      abi: NonceEnforcer,
      functionName: 'incrementNonce',
      args: [aliceSmartAccount.environment.DelegationManager],
    });

    const encodedCalldata = NonceEnforcerUtils.encode.incrementNonce(
      aliceSmartAccount.environment.DelegationManager,
    );

    expect(encodedCalldata).toBe(expectedCalldata);
  });

  test('encode utility integrates with userOp submission correctly', async () => {
    // Check initial nonce is 0
    let currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(0n);

    // Use the encode utility to create the calldata
    const calldata = NonceEnforcerUtils.encode.incrementNonce(
      aliceSmartAccount.environment.DelegationManager,
    );

    // Verify the calldata is correctly formatted
    expect(calldata).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(calldata.length).toBeGreaterThan(10); // Should be more than just '0x'

    // Submit the user operation using the delegator account (Alice)
    const userOpHash = await sponsoredBundlerClient.sendUserOperation({
      account: aliceSmartAccount,
      calls: [
        {
          to: nonceEnforcerAddress,
          data: calldata,
        },
      ],
      ...gasPrice,
    });

    const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    expectUserOperationToSucceed(receipt);

    // Verify nonce increased to 1
    currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(1n);
  });

  test('incrementNonce using encode utility with direct userOp submission', async () => {
    // Check initial nonce
    let currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(0n);

    // Use encode utility to create the calldata
    const calldata = NonceEnforcerUtils.encode.incrementNonce(
      aliceSmartAccount.environment.DelegationManager,
    );

    // Submit user operation with Alice as the sender (delegator)
    const userOpHash = await sponsoredBundlerClient.sendUserOperation({
      account: aliceSmartAccount,
      calls: [
        {
          to: nonceEnforcerAddress,
          data: calldata,
        },
      ],
      ...gasPrice,
    });

    const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    expectUserOperationToSucceed(receipt);

    // Verify nonce increased to 1
    currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(1n);
  });

  test('multiple incrementNonce calls using utilities correctly track nonce progression', async () => {
    // Initial nonce should be 0
    let currentNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(currentNonce).toBe(0n);

    // Increment nonce 3 times using encode utility
    for (let i = 1; i <= 3; i++) {
      const calldata = NonceEnforcerUtils.encode.incrementNonce(
        aliceSmartAccount.environment.DelegationManager,
      );

      const userOpHash = await sponsoredBundlerClient.sendUserOperation({
        account: aliceSmartAccount,
        calls: [
          {
            to: nonceEnforcerAddress,
            data: calldata,
          },
        ],
        ...gasPrice,
      });

      const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      expectUserOperationToSucceed(receipt);

      // Verify nonce increased correctly
      currentNonce = await NonceEnforcerUtils.read.currentNonce({
        client: publicClient,
        contractAddress: nonceEnforcerAddress,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
        delegator: aliceSmartAccount.address,
      });
      expect(currentNonce).toBe(BigInt(i));
    }
  });

  test('incrementNonce works correctly when called by different accounts', async () => {
    // Bob can increment his own nonce for Alice's delegation manager
    const calldata = NonceEnforcerUtils.encode.incrementNonce(
      aliceSmartAccount.environment.DelegationManager,
    );

    // Bob increments his own nonce (not Alice's nonce)
    const userOpHash = await sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: nonceEnforcerAddress,
          data: calldata,
        },
      ],
      ...gasPrice,
    });

    const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    expectUserOperationToSucceed(receipt);

    // Verify Alice's nonce remained unchanged (still 0)
    const aliceNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: aliceSmartAccount.address,
    });
    expect(aliceNonce).toBe(0n);

    // Verify Bob's nonce increased to 1 (he incremented his own nonce)
    const bobNonce = await NonceEnforcerUtils.read.currentNonce({
      client: publicClient,
      contractAddress: nonceEnforcerAddress,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
      delegator: bobSmartAccount.address,
    });
    expect(bobNonce).toBe(1n);
  });
});
