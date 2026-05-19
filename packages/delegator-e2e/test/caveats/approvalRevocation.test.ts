import { beforeEach, expect, test } from 'vitest';
import {
  createExecution,
  ExecutionMode,
  Implementation,
  ROOT_AUTHORITY,
  toMetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import type {
  Delegation,
  MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import {
  createCaveatBuilder,
  encodeDelegations,
  encodeExecutionCalldatas,
} from '@metamask/smart-accounts-kit/utils';
import {
  deployErc20Token,
  deploySmartAccount,
  fundAddressWithErc20Token,
  gasPrice,
  publicClient,
  randomAddress,
  sponsoredBundlerClient,
} from '../utils/helpers';
import { encodeFunctionData, parseEther, type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { expectUserOperationToSucceed } from '../utils/assertions';
import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';

const { abi: erc20TokenAbi } = ERC20Token;

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let erc20TokenAddress: Hex;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  erc20TokenAddress = await deployErc20Token();

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

  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress,
    parseEther('10'),
  );
});

test('maincase: Bob revokes an existing ERC20 approval', async () => {
  const spender = randomAddress();
  const initialAllowance = parseEther('3');

  await setErc20Approval(aliceSmartAccount, spender, initialAllowance);

  const allowanceBefore = await getErc20Allowance(
    aliceSmartAccount.address,
    spender,
  );
  expect(allowanceBefore).toEqual(initialAllowance);

  const delegation: Delegation = {
    delegate: bobSmartAccount.address,
    delegator: aliceSmartAccount.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(aliceSmartAccount.environment)
      .addCaveat('approvalRevocation', {
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: false,
        permit2Approve: false,
        permit2Lockdown: false,
        permit2InvalidateNonces: false,
      })
      .build(),
    signature: '0x',
  };

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  const execution = createExecution({
    target: erc20TokenAddress,
    callData: encodeFunctionData({
      abi: erc20TokenAbi,
      functionName: 'approve',
      args: [spender, 0n],
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
        data: redeemData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  expectUserOperationToSucceed(receipt);

  const allowanceAfter = await getErc20Allowance(
    aliceSmartAccount.address,
    spender,
  );
  expect(allowanceAfter).toEqual(0n);
});

const setErc20Approval = async (
  owner: MetaMaskSmartAccount<Implementation>,
  spender: Address,
  amount: bigint,
) => {
  const approveCallData = encodeFunctionData({
    abi: erc20TokenAbi,
    functionName: 'approve',
    args: [spender, amount],
  });

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: owner,
    calls: [
      {
        to: erc20TokenAddress,
        data: approveCallData,
      },
    ],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  expectUserOperationToSucceed(receipt);
};

const getErc20Allowance = async (
  owner: Address,
  spender: Address,
): Promise<bigint> => {
  const result = await publicClient.readContract({
    address: erc20TokenAddress,
    abi: erc20TokenAbi,
    functionName: 'allowance',
    args: [owner, spender],
  });

  if (typeof result !== 'bigint') {
    throw new Error('Result is not a bigint');
  }

  return result;
};
