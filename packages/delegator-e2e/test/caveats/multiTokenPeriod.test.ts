import { beforeEach, test, expect } from 'vitest';
import {
  encodeExecutionCalldatas,
  encodeDelegations,
  createCaveatBuilder,
} from '@metamask/smart-accounts-kit/utils';
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
  gasPrice,
  sponsoredBundlerClient,
  deploySmartAccount,
  publicClient,
  randomAddress,
  deployErc20Token,
  fundAddressWithErc20Token,
  getErc20Balance,
  stringToUnprefixedHex,
} from '../utils/helpers';
import {
  encodeFunctionData,
  type Hex,
  parseEther,
  concat,
  encodePacked,
} from 'viem';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';
const { abi: erc20TokenAbi } = ERC20Token;

let aliceSmartAccount: MetaMaskSmartAccount;
let bobSmartAccount: MetaMaskSmartAccount;
let erc20TokenAddress1: Hex;
let erc20TokenAddress2: Hex;
let currentTime: number;

type TokenPeriodConfig = {
  token: Hex;
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

type TokenTransfer = {
  token: Hex;
  amount: bigint;
  recipient: Hex;
};

/**
 * These tests verify the MultiTokenPeriod caveat functionality.
 *
 * The MultiTokenPeriod caveat allows a delegator to grant permission to a delegate
 * to transfer multiple tokens with the following constraints for each token:
 * - periodAmount: Maximum amount that can be transferred per period
 * - periodDuration: Duration of each period in seconds
 * - startDate: Timestamp when the first period begins
 *
 * The available amount resets at the beginning of each period for each token, and any unused tokens
 * are forfeited once the period ends.
 *
 * Alice creates a delegation to Bob with a MultiTokenPeriod caveat.
 * Bob redeems the delegation, transferring amounts of different tokens to third parties.
 */

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  erc20TokenAddress1 = await deployErc20Token();
  erc20TokenAddress2 = await deployErc20Token();

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

  // Fund Alice's account with both tokens
  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress1,
    parseEther('10'),
  );
  await fundAddressWithErc20Token(
    aliceSmartAccount.address,
    erc20TokenAddress2,
    parseEther('10'),
  );

  const { timestamp } = await publicClient.getBlock({ blockTag: 'latest' });
  currentTime = Number(timestamp);
});

const runTest_expectSuccess = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  configs: TokenPeriodConfig[],
  transfer: TokenTransfer,
  configIndex: number,
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('multiTokenPeriod', { tokenConfigs: configs })
      .build(),
    signature: '0x',
  };

  if (!delegation.caveats[0]) {
    throw new Error('MultiTokenPeriod caveat not found');
  }

  // Set the configIndex in the args after creating the delegation
  // Encode configIndex as a uint256
  delegation.caveats[0].args = encodePacked(['uint256'], [BigInt(configIndex)]);

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

  const balanceBefore = await getErc20Balance(
    transfer.recipient,
    transfer.token,
  );

  const execution = createExecution({
    target: transfer.token,
    callData: encodeFunctionData({
      abi: erc20TokenAbi,
      functionName: 'transfer',
      args: [transfer.recipient, transfer.amount],
    }),
  });

  const call = {
    to: bobSmartAccount.address,
    data: encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [encodeDelegations([signedDelegation])],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([[execution]]),
      ],
    }),
  };

  const userOpHash = await sponsoredBundlerClient.sendUserOperation({
    account: bobSmartAccount,
    calls: [call],
    ...gasPrice,
  });

  const receipt = await sponsoredBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  await expectUserOperationToSucceed(receipt);

  const balanceAfter = await getErc20Balance(
    transfer.recipient,
    transfer.token,
  );
  expect(balanceAfter).toBe(balanceBefore + transfer.amount);
};

const runTest_expectFailure = async (
  delegate: Hex,
  delegator: MetaMaskSmartAccount<Implementation>,
  configs: TokenPeriodConfig[],
  transfer: TokenTransfer,
  expectedError: string,
  configIndex: number,
  modifyCaveats?: (caveats: any[]) => void,
  customExecution?: {
    token: Hex;
    value: bigint;
    calldata: Hex;
  },
) => {
  const { environment } = aliceSmartAccount;

  const delegation: Delegation = {
    delegate,
    delegator: delegator.address,
    authority: ROOT_AUTHORITY,
    salt: '0x0',
    caveats: createCaveatBuilder(environment)
      .addCaveat('multiTokenPeriod', { tokenConfigs: configs })
      .build(),
    signature: '0x',
  };

  if (!delegation.caveats[0]) {
    throw new Error('MultiTokenPeriod caveat not found');
  }

  // Set the configIndex in the args
  delegation.caveats[0].args = encodePacked(['uint256'], [BigInt(configIndex)]);

  // Allow modification of caveats if needed
  if (modifyCaveats) {
    modifyCaveats(delegation.caveats);
  }

  const signedDelegation = {
    ...delegation,
    signature: await delegator.signDelegation({
      delegation,
    }),
  };

  const execution = customExecution
    ? createExecution({
        target: customExecution.token,
        value: customExecution.value,
        callData: customExecution.calldata,
      })
    : createExecution({
        target: transfer.token,
        callData: encodeFunctionData({
          abi: erc20TokenAbi,
          functionName: 'transfer',
          args: [transfer.recipient, transfer.amount],
        }),
      });

  const call = {
    to: bobSmartAccount.address,
    data: encodeFunctionData({
      abi: bobSmartAccount.abi,
      functionName: 'redeemDelegations',
      args: [
        [encodeDelegations([signedDelegation])],
        [ExecutionMode.SingleDefault],
        encodeExecutionCalldatas([[execution]]),
      ],
    }),
  };

  await expect(
    sponsoredBundlerClient.sendUserOperation({
      account: bobSmartAccount,
      calls: [call],
      ...gasPrice,
    }),
  ).rejects.toThrow(stringToUnprefixedHex(expectedError));
};

test('maincase: Bob redeems the delegation within period limit', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('3'),
    recipient: recipient,
  };

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    0,
  );
});

test('Bob redeems the delegation with a second config', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
    {
      token: erc20TokenAddress2,
      periodAmount: parseEther('3'),
      periodDuration: 7200, // 2 hours
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress2,
    amount: parseEther('2'),
    recipient: recipient,
  };

  await runTest_expectSuccess(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    1,
  );
});

test('Bob attempts to redeem with a transfer exceeding period limit', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('6'), // Exceeds period limit
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:transfer-amount-exceeded',
    0,
  );
});

test('Bob attempts to redeem before start date', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime + 3600, // 1 hour in the future
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:transfer-not-started',
    0,
  );
});

test('Bob attempts to redeem with invalid terms length', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-terms-length',
    0,
    (caveats) => {
      // Create invalid terms length by appending an empty byte
      caveats[0].terms = concat([caveats[0].terms, '0x00']);
    },
  );
});

test('Bob attempts to redeem with invalid token index', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-token-index',
    1, // Using index 1 when only index 0 exists
  );
});

test('Bob attempts to redeem with non-zero value in ERC20 transfer', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-value-in-erc20-transfer',
    0,
    undefined,
    {
      token: erc20TokenAddress1,
      value: parseEther('1'), // Non-zero value
      calldata: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [transfer.recipient, transfer.amount],
      }),
    },
  );
});

test('Bob attempts to redeem with invalid ERC20 method', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-method',
    0,
    undefined,
    {
      token: erc20TokenAddress1,
      value: 0n,
      calldata: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'approve',
        args: [transfer.recipient, transfer.amount],
      }),
    },
  );
});

test('Bob attempts to redeem with zero value in native transfer', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: '0x0000000000000000000000000000000000000000' as Hex,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: '0x0000000000000000000000000000000000000000' as Hex,
    amount: 0n,
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-zero-value-in-native-transfer',
    0,
    undefined,
    {
      token: '0x0000000000000000000000000000000000000000' as Hex,
      value: 0n,
      calldata: '0x',
    },
  );
});

test('Bob attempts to redeem with invalid call data length', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:invalid-call-data-length',
    0,
    undefined,
    {
      token: erc20TokenAddress1,
      value: 0n,
      calldata: '0x1234' as Hex,
    },
  );
});

test('Bob attempts to redeem with token mismatch', async () => {
  const recipient = randomAddress();

  const configs = [
    {
      token: erc20TokenAddress1,
      periodAmount: parseEther('5'),
      periodDuration: 3600, // 1 hour
      startDate: currentTime,
    },
  ];

  const transfer = {
    token: erc20TokenAddress1,
    amount: parseEther('1'),
    recipient,
  };

  await runTest_expectFailure(
    bobSmartAccount.address,
    aliceSmartAccount,
    configs,
    transfer,
    'MultiTokenPeriodEnforcer:token-mismatch',
    0,
    undefined,
    {
      token: erc20TokenAddress2, // Using different token than configured
      value: 0n,
      calldata: encodeFunctionData({
        abi: erc20TokenAbi,
        functionName: 'transfer',
        args: [transfer.recipient, transfer.amount],
      }),
    },
  );
});
