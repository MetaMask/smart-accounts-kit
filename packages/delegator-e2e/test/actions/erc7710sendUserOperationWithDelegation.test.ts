import { beforeEach, expect, test } from 'vitest';
import {
  deployCounter,
  transport,
  deploySmartAccount,
  publicClient,
  fundAddress,
  sponsoredBundlerClient,
  gasPrice,
  randomAddress,
} from '../utils/helpers';
import { chain } from '../../src/config';

import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
  createDelegation,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { erc7710BundlerActions } from '@metamask/smart-accounts-kit/actions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  createPublicClient,
  Address,
  getContract,
  Hex,
  encodeFunctionData,
} from 'viem';
import { encodeDelegations } from '@metamask/smart-accounts-kit/utils';
import CounterMetadata from '../utils/counter/metadata.json';
import { expectUserOperationToSucceed } from '../utils/assertions';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let bobSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let aliceCounterContractAddress: Address;
let permissionsContext: Hex;
let signedDelegation: Delegation;

const bundlerClient = sponsoredBundlerClient.extend(erc7710BundlerActions());

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  const client = createPublicClient({ transport, chain });

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x',
    signer: { account: alice },
  });

  bobSmartAccount = await toMetaMaskSmartAccount({
    client,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt: '0x',
    signer: { account: bob },
  });

  const aliceCounter = await deployCounter(aliceSmartAccount.address);
  aliceCounterContractAddress = aliceCounter.address;

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    scope: {
      type: 'functionCall',
      targets: [aliceCounterContractAddress],
      selectors: ['increment()'],
    },
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    caveats: [{ type: 'valueLte', maxValue: 0n }],
  });

  signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  permissionsContext = encodeDelegations([signedDelegation]);
});

/*
  Alice creates a delegation from her SmartContractAccount to Bob's smart account, allowing Bob's account to call the increment function on Alice's counter contract.
  Bob redeems the delegation using the experimental ERC-7710 sendUserOperationWithDelegation function.
*/

test('maincase: Bob redeems the delegation in order to call increment() on the counter contract', async () => {
  await deploySmartAccount(aliceSmartAccount);
  await fundAddress(bobSmartAccount.address);

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);

  const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
    publicClient,
    account: bobSmartAccount,
    calls: [
      {
        to: aliceCounterContractAddress,
        data: encodeFunctionData({
          abi: CounterMetadata.abi,
          functionName: 'increment',
        }),
        value: 0n,
        permissionsContext,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
      },
    ],
    ...gasPrice,
    dependencies: [{ factory, factoryData }],
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(1n);
});

test('Bob redeems the delegation in order to call increment() on the counter contract, and fund an address', async () => {
  await deploySmartAccount(aliceSmartAccount);
  await fundAddress(bobSmartAccount.address);

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);
  const targetAddress = randomAddress();

  const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
    publicClient,
    account: bobSmartAccount,
    calls: [
      {
        to: aliceCounterContractAddress,
        data: encodeFunctionData({
          abi: CounterMetadata.abi,
          functionName: 'increment',
        }),
        value: 0n,
        permissionsContext,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
      },
      {
        to: targetAddress,
        data: '0x',
        value: 10n,
      },
    ],
    ...gasPrice,
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(1n);

  const targetAddressBalance = await publicClient.getBalance({
    address: targetAddress,
  });

  expect(targetAddressBalance).toEqual(10n);
});

test('Bob redeems the delegation, and deploys Alices smart account via dependencies', async () => {
  await fundAddress(bobSmartAccount.address);

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const { factory, factoryData } = await aliceSmartAccount.getFactoryArgs();

  if (factory === undefined || factoryData === undefined) {
    throw new Error('Factory args not found');
  }

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);

  const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
    publicClient,
    account: bobSmartAccount,
    calls: [
      {
        to: aliceCounterContractAddress,
        data: encodeFunctionData({
          abi: CounterMetadata.abi,
          functionName: 'increment',
        }),
        value: 0n,
        permissionsContext,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
      },
    ],
    ...gasPrice,
    accountMetadata: [{ factory, factoryData }],
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(1n);
});

test('Bob redeems the delegation, with dependencies, even though Alices account is already deployed', async () => {
  await fundAddress(bobSmartAccount.address);

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const { factory, factoryData } = await aliceSmartAccount.getFactoryArgs();

  if (factory === undefined || factoryData === undefined) {
    throw new Error('Factory args not found');
  }

  await deploySmartAccount(aliceSmartAccount);

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);
  await publicClient.call({});
  const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
    publicClient,
    account: bobSmartAccount,
    calls: [
      {
        to: aliceCounterContractAddress,
        data: encodeFunctionData({
          abi: CounterMetadata.abi,
          functionName: 'increment',
        }),
        value: 0n,
        permissionsContext,
        delegationManager: aliceSmartAccount.environment.DelegationManager,
      },
    ],
    ...gasPrice,
    accountMetadata: [{ factory, factoryData }],
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(1n);
});

test('Bob calls sendUserOperationWithDelegation with the same dependencies multiple times', async () => {
  await fundAddress(bobSmartAccount.address);

  const { factory, factoryData } = await aliceSmartAccount.getFactoryArgs();

  if (factory === undefined || factoryData === undefined) {
    throw new Error('Factory args not found');
  }
  const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
    publicClient,
    account: bobSmartAccount,
    calls: [
      {
        to: aliceSmartAccount.address,
        value: 10n,
      },
    ],
    ...gasPrice,
    dependencies: [
      { factory, factoryData },
      { factory, factoryData },
    ],
  });

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  const aliceSmartAccountCode = await publicClient.getCode({
    address: aliceSmartAccount.address,
  });

  expect(aliceSmartAccountCode).not.toBeNull();
  expect(aliceSmartAccountCode).not.toBe('0x');

  const aliceSmartAccountBalance = await publicClient.getBalance({
    address: aliceSmartAccount.address,
  });

  expect(aliceSmartAccountBalance).toEqual(10n);
});

// callData is disallowed, because if we attempt to re-encode with additional calls (ie dependencies)
// the inner call will be targetting a function on the smart account, which is likely attributed with
// OnlyEntryPoint. Because it's calling from the smart account, it will fail.
test.skip('Bob attempts to call sendUserOperationWithDelegation with callData specified', async () => {
  // this test does not need to be run, it's just here to ensure that the type is correct
  await bundlerClient.sendUserOperationWithDelegation({
    account: bobSmartAccount,
    // @ts-expect-error callData is disallowed
    callData: '0x1234',
    ...gasPrice,
  });
});
