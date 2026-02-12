import { beforeEach, expect, test } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData } from 'viem';
import {
  Implementation,
  toMetaMaskSmartAccount,
  createDelegation,
  createExecution,
  ExecutionMode,
  createInfuraBundlerClient,
  type MetaMaskSmartAccount,
  type InfuraBundlerClient,
} from '@metamask/smart-accounts-kit';
import {
  encodeDelegations,
  encodeExecutionCalldatas,
} from '@metamask/smart-accounts-kit/utils';
import { publicClient, gasPrice, deploySmartAccount } from '../utils/helpers';
import { expectUserOperationToSucceed } from '../utils/assertions';
import { bundlerUrl, paymasterUrl } from '../../src/config';
import { http } from 'viem';
import { createPaymasterClient } from 'viem/account-abstraction';

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let bobSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let infuraBundlerClient: InfuraBundlerClient;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());
  const bob = privateKeyToAccount(generatePrivateKey());

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    signer: { account: alice },
  });
  await deploySmartAccount(aliceSmartAccount);

  bobSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [bob.address, [], [], []],
    deploySalt:
      '0x0000000000000000000000000000000000000000000000000000000000000002',
    signer: { account: bob },
  });
  await deploySmartAccount(bobSmartAccount);

  // Create Infura bundler client for testing
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterUrl),
  });

  infuraBundlerClient = createInfuraBundlerClient({
    transport: http(bundlerUrl),
    paymaster: paymasterClient,
  });
});

test('createInfuraBundlerClient should have standard bundler methods', () => {
  expect(infuraBundlerClient.sendUserOperation).toBeDefined();
  expect(infuraBundlerClient.waitForUserOperationReceipt).toBeDefined();
  expect(infuraBundlerClient.estimateUserOperationGas).toBeDefined();
});

test('createInfuraBundlerClient should have getUserOperationGasPrice method', () => {
  expect(infuraBundlerClient.getUserOperationGasPrice).toBeDefined();
  expect(typeof infuraBundlerClient.getUserOperationGasPrice).toBe('function');
});

test('getUserOperationGasPrice should return valid gas price structure', async () => {
  const gasPrices = await infuraBundlerClient.getUserOperationGasPrice();

  expect(gasPrices).toHaveProperty('slow');
  expect(gasPrices).toHaveProperty('standard');
  expect(gasPrices).toHaveProperty('fast');

  for (const tier of ['slow', 'standard', 'fast'] as const) {
    expect(gasPrices[tier]).toHaveProperty('maxFeePerGas');
    expect(gasPrices[tier]).toHaveProperty('maxPriorityFeePerGas');
    expect(typeof gasPrices[tier].maxFeePerGas).toBe('string');
    expect(typeof gasPrices[tier].maxPriorityFeePerGas).toBe('string');
    expect(gasPrices[tier].maxFeePerGas).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(gasPrices[tier].maxPriorityFeePerGas).toMatch(/^0x[0-9a-fA-F]+$/);
  }
});

test('infuraBundlerClient should work for delegation redemption', async () => {
  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: bobSmartAccount.address,
    from: aliceSmartAccount.address,
    scope: {
      type: 'nativeTokenTransferAmount',
      maxAmount: 0n,
    },
  });

  const signedDelegation = {
    ...delegation,
    signature: await aliceSmartAccount.signDelegation({ delegation }),
  };

  const execution = createExecution({
    target: '0x0000000000000000000000000000000000000000',
    value: 0n,
    callData: '0x',
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

  const userOpHash = await infuraBundlerClient.sendUserOperation({
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

  const receipt = await infuraBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  await expectUserOperationToSucceed(receipt);
});

test('infuraBundlerClient should work with dynamic gas pricing', async () => {
  const gasPrices = await infuraBundlerClient.getUserOperationGasPrice();

  const dynamicGasConfig = {
    maxFeePerGas: BigInt(gasPrices.standard.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.standard.maxPriorityFeePerGas),
  };

  const userOpHash = await infuraBundlerClient.sendUserOperation({
    account: aliceSmartAccount,
    calls: [
      {
        to: '0x0000000000000000000000000000000000000000',
        value: 0n,
        data: '0x',
      },
    ],
    ...dynamicGasConfig,
  });

  const receipt = await infuraBundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  await expectUserOperationToSucceed(receipt);
});
