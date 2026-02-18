import { beforeEach, expect, test } from 'vitest';
import {
  publicClient,
  deployCounter,
  transport,
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  stringToUnprefixedHex,
} from './utils/helpers';
import { expectCodeAt, expectUserOperationToSucceed } from './utils/assertions';

import {
  createExecution,
  createDelegation,
  ExecutionMode,
  Implementation,
  toMetaMaskSmartAccount,
  signDelegation,
  aggregateSignature,
  type MetaMaskSmartAccount,
  type PartialSignature,
} from '@metamask/smart-accounts-kit';
import {
  encodeDelegations,
  encodeExecutionCalldatas,
} from '@metamask/smart-accounts-kit/utils';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  createClient,
  encodeFunctionData,
  getContract,
  Address,
  createWalletClient,
} from 'viem';
import { chain } from '../src/config';
import CounterMetadata from './utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let bobSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let aliceCounterContractAddress: Address;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x',
    signer: { account: alice },
  });
  await deploySmartAccount(aliceSmartAccount);

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x',
    signer: { account: bob },
  });

  const aliceCounter = await deployCounter(aliceSmartAccount.address);
  aliceCounterContractAddress = aliceCounter.address;
});

/*
  Alice creates a DeleGatorSmartAccount for a counterfactual Hybrid delegator account.

  A Counter contract is deployed, with Alice's delegator account
  as the owner.

  Bob creates a DeleGatorSmartAccount for a counterfactual Hybrid Delegator Account.
  
  Alice creates a delegation to Bob's delegator account, permitting him to increment
  the counter.

  Bob submits a User Operation, using the delegation, which deploys his delegator
  account and increment's Alice's counter.
*/

test('maincase: Bob increments the counter with a delegation from Alice', async () => {
  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();

  expect(countBefore, 'Expected initial count to be 0n').toEqual(0n);

  const { environment } = aliceSmartAccount;

  const delegation = createDelegation({
    environment,
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: [aliceCounterContractAddress],
      selectors: ['increment()'],
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: aliceCounterContractAddress,
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

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
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

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  await expectCodeAt(
    bobSmartAccount.address,
    `Expected code to be deployed to Bob's gator address: ${bobSmartAccount.address}`,
  );

  const countAfter = await counterContract.read.count();

  expect(countAfter, 'Expected final count to have incremented').toEqual(1n);
});

test('Bob attempts to increment the counter without a delegation', async () => {
  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();
  expect(countBefore, 'Expected initial count to be 0n').toEqual(0n);

  const incrementData = encodeFunctionData({
    abi: CounterMetadata.abi,
    functionName: 'increment',
  });

  const expectedError = 'Ownable: caller is not the owner';

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [
        {
          to: aliceCounterContractAddress,
          value: 0n,
          data: incrementData,
        },
      ],
      ...gasPrice,
    }),
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));

  const countAfter = await counterContract.read.count();
  expect(countAfter, 'Expected final count to be 0n').toEqual(0n);
});

test("Bob attempts to increment the counter with a delegation from Alice that doesn't allow calls to `increment()`", async () => {
  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();
  expect(countBefore, 'Expected initial count to be 0n').toEqual(0n);

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: [aliceCounterContractAddress],
      selectors: ['notTheRightFunction()'],
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({
      delegation,
    }),
  };

  const execution = createExecution({
    target: aliceCounterContractAddress,
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

  const expectedError = 'AllowedMethodsEnforcer:method-not-allowed';

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
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));

  const countAfter = await counterContract.read.count();
  expect(countAfter, 'Expected final count to be 0n').toEqual(0n);
});

test('Bob increments the counter with a delegation from a multisig account', async () => {
  const privateKeys = [
    generatePrivateKey(),
    generatePrivateKey(),
    generatePrivateKey(),
  ];
  const signers = privateKeys.map((pk) => privateKeyToAccount(pk));

  // take all but the first signer as the signer
  const signer = signers.slice(1).map((account) => ({
    account,
  }));

  const multisigSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.MultiSig,
    deployParams: [signers.map((account) => account.address), 2n],
    deploySalt: '0x',
    signer,
  });
  await deploySmartAccount(multisigSmartAccount);

  const counterContract = await deployCounter(multisigSmartAccount.address);

  const countBefore = await counterContract.read.count();
  expect(countBefore, 'Expected initial count to be 0n').toEqual(0n);

  const delegation = createDelegation({
    environment: multisigSmartAccount.environment,
    to: bobSmartAccount.address,
    from: multisigSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: [counterContract.address],
      selectors: ['increment()'],
    },
  });

  // Get signatures from each signer (using stored private keys)
  const signatures: PartialSignature[] = await Promise.all(
    privateKeys.slice(1).map(async (privateKey, index) => {
      const signer = signers[index + 1]; // corresponding signer account
      const signature = await signDelegation({
        privateKey,
        delegation,
        delegationManager: multisigSmartAccount.environment.DelegationManager,
        chainId: chain.id,
      });

      return {
        signature,
        signer: signer.address,
        type: 'ECDSA',
      };
    }),
  );

  // Combine signatures into a single signature
  const signature = aggregateSignature({ signatures });

  const signedDelegation = {
    ...delegation,
    signature,
  };

  const execution = createExecution({
    target: counterContract.address,
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

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
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

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  await expectCodeAt(
    bobSmartAccount.address,
    `Expected code to be deployed to Bob's gator address: ${bobSmartAccount.address}`,
  );

  const countAfter = await counterContract.read.count();
  expect(countAfter, 'Expected final count to have incremented').toEqual(1n);
});