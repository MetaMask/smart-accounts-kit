import { beforeEach, expect, test } from 'vitest';
import {
  deployCounter,
  transport,
  deploySmartAccount,
  publicClient,
  fundAddress,
  randomAddress,
} from '../utils/helpers';
import { chain } from '../../src/config';

import {
  Implementation,
  toMetaMaskSmartAccount,
  createDelegation,
  signDelegation,
  type MetaMaskSmartAccount,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { erc7710WalletActions } from '@metamask/smart-accounts-kit/actions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  Address,
  createWalletClient,
  getContract,
  Account,
  encodeFunctionData,
  Hex,
} from 'viem';
import {
  encodeDelegations,
  getDelegationHashOffchain,
} from '@metamask/smart-accounts-kit/utils';

import CounterMetadata from '../utils/counter/metadata.json';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let bob: Account;
let bobPrivateKey: Hex;
let aliceCounterContractAddress: Address;
let permissionContext: Hex;
let signedDelegation: Delegation;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  bobPrivateKey = generatePrivateKey();
  bob = privateKeyToAccount(bobPrivateKey);
  await fundAddress(bob.address);

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x',
    signer: { account: alice },
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
    to: bob.address,
    from: aliceSmartAccount.address,
    caveats: [{ type: 'valueLte', maxValue: 0n }],
  });

  signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  permissionContext = encodeDelegations([signedDelegation]);
});

/*
  Alice creates a delegation from her SmartContractAccount to Bob's EOA, allowing Bob's account to call the increment function on Alice's counter contract.
  Bob redeems the delegation using the experimental ERC-7710 redemption function.
*/

test('maincase: Bob redeems the delegation in order to increment() on the counter contract', async () => {
  await deploySmartAccount(aliceSmartAccount);
  const bobWalletClient = createWalletClient({
    account: bob,
    transport,
    chain,
  }).extend(erc7710WalletActions());

  const { DelegationManager: delegationManager } =
    aliceSmartAccount.environment;

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);

  const transactionHash = await bobWalletClient.sendTransactionWithDelegation({
    //todo: this should be typed such that account and chain doesn't need to be passed in
    account: bob,
    chain,
    to: aliceCounterContractAddress,
    data: encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'increment',
    }),
    permissionContext,
    delegationManager,
  });

  await publicClient.waitForTransactionReceipt({ hash: transactionHash });

  const countAfter = (await counterContract.read.count()) as any as bigint;

  expect(countAfter).toEqual(1n);
});

test('Bob redelegates to Carol, who redeems the delegation to call increment() on the counter contract', async () => {
  await deploySmartAccount(aliceSmartAccount);
  const carol = privateKeyToAccount(generatePrivateKey());
  await fundAddress(carol.address);

  const carolWalletClient = createWalletClient({
    account: carol,
    transport,
    chain,
  }).extend(erc7710WalletActions());

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const { DelegationManager: delegationManager } =
    aliceSmartAccount.environment;

  const redelegation: Delegation = {
    delegate: carol.address,
    delegator: bob.address,
    authority: getDelegationHashOffchain(signedDelegation),
    salt: '0x0',
    caveats: [],
    signature: '0x',
  };

  const signedRedelegation: Delegation = {
    ...redelegation,
    signature: await signDelegation({
      privateKey: bobPrivateKey,
      delegation: redelegation,
      delegationManager,
      chainId: chain.id,
      allowInsecureUnrestrictedDelegation: true,
    }),
  };

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);

  const redelegatedPermissionsContext = encodeDelegations([
    signedRedelegation,
    signedDelegation,
  ]);

  const transactionHash = await carolWalletClient.sendTransactionWithDelegation(
    {
      //todo: this should be typed such that account and chain doesn't need to be passed in
      account: carol,
      chain,
      to: aliceCounterContractAddress,
      data: encodeFunctionData({
        abi: CounterMetadata.abi,
        functionName: 'increment',
      }),
      permissionContext: redelegatedPermissionsContext,
      delegationManager,
    },
  );

  await publicClient.waitForTransactionReceipt({ hash: transactionHash });

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(1n);
});

test('Bob attempts to call the increment function directly', async () => {
  const bobWalletClient = createWalletClient({
    account: bob,
    transport,
    chain,
  }).extend(erc7710WalletActions());

  const counterContract = getContract({
    address: aliceCounterContractAddress,
    abi: CounterMetadata.abi,
    client: publicClient,
  });

  const countBefore = await counterContract.read.count();

  expect(countBefore).toEqual(0n);

  const sendTransactionResponse = bobWalletClient.sendTransaction({
    account: bob,
    chain,
    to: aliceCounterContractAddress,
    data: encodeFunctionData({
      abi: CounterMetadata.abi,
      functionName: 'increment',
    }),
  });

  const expectedError = 'Ownable: caller is not the owner';

  await expect(sendTransactionResponse).rejects.toThrow(expectedError);

  const countAfter = await counterContract.read.count();

  expect(countAfter).toEqual(0n);
});

test('Bob sends a native value transaction with delegation', async () => {
  await deploySmartAccount(aliceSmartAccount);

  const maxAmount = 100n;
  const recipient = randomAddress();

  const { DelegationManager: delegationManager } =
    aliceSmartAccount.environment;

  const delegation = createDelegation({
    to: bob.address,
    from: aliceSmartAccount.address,
    environment: aliceSmartAccount.environment,
    scope: { type: 'nativeTokenTransferAmount', maxAmount },
    caveats: [],
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  const permissionContext = encodeDelegations([signedDelegation]);

  const bobWalletClient = createWalletClient({
    account: bob,
    transport,
    chain,
  }).extend(erc7710WalletActions());

  await fundAddress(aliceSmartAccount.address, maxAmount);

  const transactionHash = await bobWalletClient.sendTransactionWithDelegation({
    account: bob,
    chain,
    to: recipient,
    value: maxAmount,
    permissionContext,
    delegationManager,
  });

  await publicClient.waitForTransactionReceipt({ hash: transactionHash });

  const balance = await publicClient.getBalance({ address: recipient });

  expect(balance).toEqual(maxAmount);
});
