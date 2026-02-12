import { expect, test, beforeAll } from 'vitest';
import {
  createPublicClient,
  http,
  parseEther,
  encodeFunctionData,
  type Address,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { createPaymasterClient } from 'viem/account-abstraction';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
  createDelegation,
  createExecution,
  ExecutionMode,
  createInfuraBundlerClient,
  type InfuraBundlerClient,
  type UserOperationGasPriceResponse,
} from '@metamask/smart-accounts-kit';
import {
  encodeDelegations,
  encodeExecutionCalldatas,
} from '@metamask/smart-accounts-kit/utils';
import { INFURA_API_KEY, PIMLICO_API_KEY } from '../src/config.js';

/**
 * INFURA BUNDLER CLIENT COMPREHENSIVE TEST SUITE
 *
 * This test suite demonstrates and validates the createInfuraBundlerClient functionality:
 * 1. Tests client creation and method availability
 * 2. Tests getUserOperationGasPrice method functionality
 * 3. Tests integration with delegation workflow
 * 4. Tests gas price usage in real transactions
 * 5. Tests complete delegation workflow with Infura bundler + Pimlico paymaster
 *
 * CONFIGURATION:
 * - RPC: Infura Sepolia testnet
 * - Bundler: Infura Sepolia testnet
 * - Paymaster: Pimlico (sponsors gas fees)
 * - Chain: Sepolia (11155111)
 * - API Keys: Imported from src/config.ts
 */

// Sepolia configuration
const INFURA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
const INFURA_BUNDLER_URL = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
const PIMLICO_PAYMASTER_URL = `https://api.pimlico.io/v2/11155111/rpc?apikey=${PIMLICO_API_KEY}`;

// Test accounts
let delegatorAccount: ReturnType<typeof privateKeyToAccount>;
let delegateAccount: ReturnType<typeof privateKeyToAccount>;

// Smart accounts
let delegatorSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let delegateSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;

// Clients
let publicClient: ReturnType<typeof createPublicClient>;
let bundlerClient: InfuraBundlerClient;
let paymasterClient: ReturnType<typeof createPaymasterClient>;

// Gas configuration that will be updated with dynamic prices
let gasConfig = {
  maxFeePerGas: parseEther('0.00001'), // 10 gwei fallback
  maxPriorityFeePerGas: parseEther('0.000001'), // 1 gwei priority fee fallback
};

beforeAll(async () => {
  console.log('🚀 Setting up Infura bundler client comprehensive test...');

  // Generate test accounts
  delegatorAccount = privateKeyToAccount(generatePrivateKey());
  delegateAccount = privateKeyToAccount(generatePrivateKey());

  console.log('👤 Test accounts created:');
  console.log('  Delegator EOA:', delegatorAccount.address);
  console.log('  Delegate EOA:', delegateAccount.address);

  // Create clients
  publicClient = createPublicClient({
    chain: sepolia,
    transport: http(INFURA_RPC_URL),
  });

  paymasterClient = createPaymasterClient({
    transport: http(PIMLICO_PAYMASTER_URL),
  });

  // Create the Infura bundler client
  bundlerClient = createInfuraBundlerClient({
    transport: http(INFURA_BUNDLER_URL),
    paymaster: paymasterClient,
    chain: sepolia,
    pollingInterval: 2000,
  });

  // Create smart accounts
  delegatorSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient as any,
    implementation: Implementation.Hybrid,
    deployParams: [delegatorAccount.address, [], [], []],
    deploySalt:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    signer: { account: delegatorAccount },
  });

  delegateSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient as any,
    implementation: Implementation.Hybrid,
    deployParams: [delegateAccount.address, [], [], []],
    deploySalt:
      '0x0000000000000000000000000000000000000000000000000000000000000002',
    signer: { account: delegateAccount },
  });

  console.log('🏭 Smart accounts created (counterfactual):');
  console.log('  Delegator Smart Account:', delegatorSmartAccount.address);
  console.log('  Delegate Smart Account:', delegateSmartAccount.address);

  console.log('✅ Setup complete');
}, 60000);

test('createInfuraBundlerClient should extend base bundler functionality', () => {
  console.log('🧪 Testing client creation and method availability...');

  // Should have all standard bundler methods
  expect(bundlerClient.sendUserOperation).toBeDefined();
  expect(bundlerClient.waitForUserOperationReceipt).toBeDefined();
  expect(bundlerClient.estimateUserOperationGas).toBeDefined();

  // Should have the new Infura/Pimlico specific method
  expect(bundlerClient.getUserOperationGasPrice).toBeDefined();
  expect(typeof bundlerClient.getUserOperationGasPrice).toBe('function');

  console.log('✅ All expected methods are available');
});

test('getUserOperationGasPrice should return valid gas price structure', async () => {
  console.log('💰 Testing getUserOperationGasPrice method...');

  const gasPrices = await bundlerClient.getUserOperationGasPrice();

  console.log('✅ Gas prices retrieved successfully:', gasPrices);

  // Verify response structure
  expect(gasPrices).toHaveProperty('slow');
  expect(gasPrices).toHaveProperty('standard');
  expect(gasPrices).toHaveProperty('fast');

  // Verify each tier has required properties and valid hex format
  for (const tier of ['slow', 'standard', 'fast'] as const) {
    expect(gasPrices[tier]).toHaveProperty('maxFeePerGas');
    expect(gasPrices[tier]).toHaveProperty('maxPriorityFeePerGas');
    expect(typeof gasPrices[tier].maxFeePerGas).toBe('string');
    expect(typeof gasPrices[tier].maxPriorityFeePerGas).toBe('string');

    // Verify hex format
    expect(gasPrices[tier].maxFeePerGas).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(gasPrices[tier].maxPriorityFeePerGas).toMatch(/^0x[0-9a-fA-F]+$/);
  }

  console.log('✅ Gas price structure is valid');
});

test('gas prices should be usable for transaction configuration', async () => {
  console.log('⚙️ Testing gas price usage in transaction configuration...');

  const gasPrices = await bundlerClient.getUserOperationGasPrice();

  // Test each tier can be converted to BigInt
  const slowConfig = {
    maxFeePerGas: BigInt(gasPrices.slow.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.slow.maxPriorityFeePerGas),
  };

  const standardConfig = {
    maxFeePerGas: BigInt(gasPrices.standard.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.standard.maxPriorityFeePerGas),
  };

  const fastConfig = {
    maxFeePerGas: BigInt(gasPrices.fast.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.fast.maxPriorityFeePerGas),
  };

  // Verify all configs are valid BigInts
  expect(typeof slowConfig.maxFeePerGas).toBe('bigint');
  expect(typeof standardConfig.maxFeePerGas).toBe('bigint');
  expect(typeof fastConfig.maxFeePerGas).toBe('bigint');

  // Verify logical ordering (fast >= standard >= slow)
  expect(fastConfig.maxFeePerGas >= standardConfig.maxFeePerGas).toBe(true);
  expect(standardConfig.maxFeePerGas >= slowConfig.maxFeePerGas).toBe(true);

  // Update global gas config with standard tier for subsequent tests
  gasConfig = standardConfig;

  console.log('✅ Gas prices are usable for transaction configuration');
  console.log('  Updated gas config:', {
    maxFeePerGas: gasConfig.maxFeePerGas.toString(),
    maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas.toString(),
  });
});

test('gas price types should be correctly defined', () => {
  console.log('🔍 Testing TypeScript type definitions...');

  // Type checking - this will only compile if types are correct
  const mockGasPrices: UserOperationGasPriceResponse = {
    slow: {
      maxFeePerGas: '0x1dcd6500',
      maxPriorityFeePerGas: '0x5f5e100',
    },
    standard: {
      maxFeePerGas: '0x3b9aca00',
      maxPriorityFeePerGas: '0xbebc200',
    },
    fast: {
      maxFeePerGas: '0x77359400',
      maxPriorityFeePerGas: '0x17d78400',
    },
  };

  expect(mockGasPrices.slow.maxFeePerGas).toBeDefined();
  expect(mockGasPrices.standard.maxFeePerGas).toBeDefined();
  expect(mockGasPrices.fast.maxFeePerGas).toBeDefined();

  console.log('✅ Type definitions are working correctly');
});

// Helper function to deploy a smart account
async function deploySmartAccount(
  smartAccount: MetaMaskSmartAccount<Implementation.Hybrid>,
  accountName: string,
  targetAddress: Address,
): Promise<string> {
  console.log(`🚀 Deploying ${accountName} smart account...`);

  const deploymentHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
      {
        to: targetAddress,
        value: 0n,
        data: '0x',
      },
    ],
    ...gasConfig,
  });

  console.log(`⏳ Waiting for ${accountName} deployment...`);
  const deploymentReceipt = await bundlerClient.waitForUserOperationReceipt({
    hash: deploymentHash,
  });

  if (deploymentReceipt.receipt.status !== 'success') {
    throw new Error(`${accountName} deployment failed`);
  }

  console.log(`✅ ${accountName} deployed! UserOp hash:`, deploymentHash);
  return deploymentHash;
}

test('complete delegation workflow with dynamic gas pricing', async () => {
  console.log(
    '🧪 Testing complete delegation workflow with dynamic gas pricing...',
  );

  // Step 1: Get and use current gas prices
  console.log('💰 Step 1: Getting current gas prices for workflow...');

  const gasPrices = await bundlerClient.getUserOperationGasPrice();
  console.log('✅ Retrieved current gas prices from Pimlico');

  // Use standard tier for all operations
  const workflowGasConfig = {
    maxFeePerGas: BigInt(gasPrices.standard.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(gasPrices.standard.maxPriorityFeePerGas),
  };

  console.log('  Using standard tier for workflow:', {
    maxFeePerGas: workflowGasConfig.maxFeePerGas.toString(),
    maxPriorityFeePerGas: workflowGasConfig.maxPriorityFeePerGas.toString(),
  });

  // Step 2: Deploy smart accounts
  console.log('🏭 Step 2: Deploying smart accounts with dynamic gas prices...');

  await deploySmartAccount(
    delegatorSmartAccount,
    'Delegator',
    delegateAccount.address,
  );

  await deploySmartAccount(
    delegateSmartAccount,
    'Delegate',
    delegatorAccount.address,
  );

  // Verify deployments
  expect(await delegatorSmartAccount.isDeployed()).toBe(true);
  expect(await delegateSmartAccount.isDeployed()).toBe(true);

  // Step 3: Create delegation
  console.log('📝 Step 3: Creating delegation...');

  const delegation = createDelegation({
    environment: delegatorSmartAccount.environment,
    to: delegateSmartAccount.address,
    from: delegatorSmartAccount.address,
    scope: {
      type: 'nativeTokenTransferAmount',
      maxAmount: 0n,
    },
  });

  // Step 4: Sign delegation
  console.log('✍️ Step 4: Signing delegation...');

  const signedDelegation = {
    ...delegation,
    signature: await delegatorSmartAccount.signDelegation({
      delegation,
    }),
  };

  // Step 5: Create execution
  console.log('⚙️ Step 5: Creating execution...');

  const execution = createExecution({
    target: '0x0000000000000000000000000000000000000000',
    value: 0n,
    callData: '0x',
  });

  // Step 6: Prepare redemption data
  console.log('🔧 Step 6: Preparing redemption data...');

  const redeemData = encodeFunctionData({
    abi: delegateSmartAccount.abi,
    functionName: 'redeemDelegations',
    args: [
      [[signedDelegation]].map(encodeDelegations),
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[execution]]),
    ],
  });

  // Step 7: Submit user operation with dynamic gas pricing
  console.log(
    '📤 Step 7: Submitting delegation redemption with dynamic gas pricing...',
  );

  const userOpHash = await bundlerClient.sendUserOperation({
    account: delegateSmartAccount,
    calls: [
      {
        to: delegateSmartAccount.address,
        value: 0n,
        data: redeemData,
      },
    ],
    ...workflowGasConfig,
  });

  console.log('🎉 User operation submitted successfully!');
  console.log('📋 UserOp Hash:', userOpHash);

  // Step 8: Wait for receipt
  console.log('⏳ Step 8: Waiting for user operation receipt...');

  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log('✅ User operation receipt received!');
  console.log('📋 Receipt details:', {
    userOpHash: receipt.userOpHash,
    transactionHash: receipt.receipt.transactionHash,
    status: receipt.receipt.status,
    gasUsed: receipt.receipt.gasUsed?.toString(),
    effectiveGasPrice: receipt.receipt.effectiveGasPrice?.toString(),
  });

  // Verify success
  expect(receipt.receipt.status).toBe('success');
  expect(userOpHash).toBeDefined();
  expect(receipt.receipt.transactionHash).toBeDefined();

  console.log(
    '🎉 SUCCESS: Complete delegation workflow with dynamic gas pricing completed!',
  );

  return {
    userOpHash,
    transactionHash: receipt.receipt.transactionHash,
    gasConfig: workflowGasConfig,
    success: true,
  };
}, 180000); // 3 minute timeout

test('should work with different client configuration options', () => {
  console.log('⚙️ Testing different configuration options...');

  const configs = [
    {
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
    },
    {
      transport: http('https://mainnet.infura.io/v3/test-key'),
      pollingInterval: 5000,
    },
    {
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
      paymaster: true as const,
    },
  ];

  for (const [index, config] of configs.entries()) {
    const client = createInfuraBundlerClient(config);

    expect(client).toBeDefined();
    expect(client.getUserOperationGasPrice).toBeDefined();
    expect(typeof client.getUserOperationGasPrice).toBe('function');

    console.log(`✅ Configuration ${index + 1} created successfully`);
  }

  console.log('✅ All configuration options work correctly');
});
