import {
  encodeFunctionData,
  encodePacked,
  getContract,
  keccak256,
  parseEther,
} from 'viem';
import { HybridDeleGator } from '@metamask/delegation-abis';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import {
  publicClient,
  sponsoredBundlerClient,
  gasPrice,
  transport,
  fundAddress,
} from './utils/helpers';
import { expect, beforeEach, test } from 'vitest';
import { expectCodeAt, expectUserOperationToSucceed } from './utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { Account, createClient } from 'viem';
import { chain } from '../src/config';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let alice: Account;

const KEY_ID = 'key_id';
// valid P256 public key coords. These were generated here: https://asecuritysite.com/ecc/ecc_test
const P256_X =
  0x422548f88fb782ffb5eca3744452c72a1e558fbd6f73be5e48e93232cc45c5b1n;
const P256_Y =
  0x6c4cd10c4cb8d5b8a17139e94882c8992572993425f41419ab7e90a42a494272n;

const expectedKeyIds = [keccak256(encodePacked(['string'], [KEY_ID]))];

beforeEach(async () => {
  alice = privateKeyToAccount(generatePrivateKey());

  const client = createClient({ transport, chain });

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x',
    signer: { account: alice },
  });
});

/*
  Alice creates a DeleGatorSmartAccount for a counterfactual Hybrid delegator account.
  She then adds a precomputed P256 key as a signer to the account
*/

test('maincase: Change the keys on a deployed gator', async () => {
  const { address } = aliceSmartAccount;

  await fundAddress(address, parseEther('1'));

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [{ to: address, value: 0n }],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  expectUserOperationToSucceed(receipt);

  await expectCodeAt(
    address,
    `Expected code to be deployed to gator address: ${address}`,
  );

  const aliceContract = getContract({
    address,
    abi: HybridDeleGator,
    client: publicClient,
  });

  const keyIdsBefore = await aliceContract.read.getKeyIdHashes();

  expect(
    keyIdsBefore,
    'Expected keyIds to be empty before adding P256 signer',
  ).toEqual([]);

  const addKeyUserOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: aliceContract.address,
        data: encodeFunctionData({
          abi: HybridDeleGator,
          functionName: 'addKey',
          args: [KEY_ID, P256_X, P256_Y],
        }),
      },
    ],
    ...gasPrice,
  });

  const addKeyReceipt =
    await sponsoredBundlerClient.waitForUserOperationReceipt({
      hash: addKeyUserOpHash,
    });

  expectUserOperationToSucceed(addKeyReceipt);

  const keyIdsAfter = await aliceContract.read.getKeyIdHashes();

  expect(keyIdsAfter, 'Expected keyIds to include the new signer').toEqual(
    expectedKeyIds,
  );
});
