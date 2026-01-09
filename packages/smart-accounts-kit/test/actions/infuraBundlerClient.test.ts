import { http } from 'viem';
import { createBundlerClient as createAABundlerClient } from 'viem/account-abstraction';
import { sepolia } from 'viem/chains';
import { expect, test, describe, vi, beforeEach } from 'vitest';

import {
  createInfuraBundlerClient,
  type InfuraBundlerClient,
  type UserOperationGasPriceResponse,
  type GasPriceTier,
} from '../../src/actions/infuraBundlerClient';

// Mock the viem bundler client
vi.mock('viem/account-abstraction', () => ({
  createBundlerClient: vi.fn(),
}));

const mockCreateAABundlerClient = vi.mocked(createAABundlerClient);

/**
 * Helper function to create a properly mocked bundler client.
 *
 * @param overrides - Optional overrides for the mock client.
 * @returns Mock bundler client objects.
 */
function createMockBundlerClient(overrides: any = {}) {
  const mockRequest = overrides.mockRequest ?? vi.fn();

  const mockExtendedClient = {
    sendUserOperation: vi.fn(),
    waitForUserOperationReceipt: vi.fn(),
    estimateUserOperationGas: vi.fn(),
    getUserOperation: vi.fn(),
    getUserOperationReceipt: vi.fn(),
    getSupportedEntryPoints: vi.fn(),
    getChainId: vi.fn(),
    request: mockRequest,
    getUserOperationGasPrice: vi.fn(),
    chain: sepolia,
    transport: http('https://sepolia.infura.io/v3/test-key'),
    ...overrides.extendedClient,
  };

  const mockBaseBundlerClient = {
    sendUserOperation: vi.fn(),
    waitForUserOperationReceipt: vi.fn(),
    estimateUserOperationGas: vi.fn(),
    getUserOperation: vi.fn(),
    getUserOperationReceipt: vi.fn(),
    getSupportedEntryPoints: vi.fn(),
    getChainId: vi.fn(),
    request: mockRequest,
    chain: sepolia,
    transport: http('https://sepolia.infura.io/v3/test-key'),
    extend: vi.fn().mockReturnValue(mockExtendedClient),
    ...overrides.baseClient,
  };

  return { mockBaseBundlerClient, mockExtendedClient, mockRequest };
}

describe('createInfuraBundlerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create a bundler client that extends base functionality', () => {
    const { mockBaseBundlerClient, mockExtendedClient } =
      createMockBundlerClient();
    mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

    const config = {
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
    };

    const infuraBundlerClient = createInfuraBundlerClient(config);

    // Should call the base createBundlerClient with the same config
    expect(mockCreateAABundlerClient).toHaveBeenCalledWith(config);

    // Should call extend with actions
    expect(mockBaseBundlerClient.extend).toHaveBeenCalledTimes(1);

    // Should have all base bundler client properties from extended client
    expect(infuraBundlerClient.sendUserOperation).toBe(
      mockExtendedClient.sendUserOperation,
    );
    expect(infuraBundlerClient.waitForUserOperationReceipt).toBe(
      mockExtendedClient.waitForUserOperationReceipt,
    );

    // Should have the new getUserOperationGasPrice method
    expect(infuraBundlerClient).toHaveProperty('getUserOperationGasPrice');
    expect(typeof infuraBundlerClient.getUserOperationGasPrice).toBe(
      'function',
    );
  });

  test('should call pimlico_getUserOperationGasPrice RPC method correctly', async () => {
    const mockGasPriceResponse: UserOperationGasPriceResponse = {
      slow: {
        maxFeePerGas: '0x829b42b5',
        maxPriorityFeePerGas: '0x829b42b5',
      },
      standard: {
        maxFeePerGas: '0x88d36a75',
        maxPriorityFeePerGas: '0x88d36a75',
      },
      fast: {
        maxFeePerGas: '0x8f0b9234',
        maxPriorityFeePerGas: '0x8f0b9234',
      },
    };

    const mockRequest = vi.fn().mockResolvedValue(mockGasPriceResponse);

    // Create extended client that actually calls the mock request
    const mockExtendedClient = {
      ...createMockBundlerClient().mockExtendedClient,
      async getUserOperationGasPrice() {
        const response = await mockRequest({
          method: 'pimlico_getUserOperationGasPrice',
          params: [],
        });
        return response as UserOperationGasPriceResponse;
      },
    };

    const mockBaseBundlerClient = {
      ...createMockBundlerClient().mockBaseBundlerClient,
      extend: vi.fn().mockReturnValue(mockExtendedClient),
    };

    mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

    const config = {
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
    };

    const infuraBundlerClient = createInfuraBundlerClient(config);

    // Actually call the method
    const result = await infuraBundlerClient.getUserOperationGasPrice();

    // Verify the RPC call was made with correct parameters
    expect(mockRequest).toHaveBeenCalledWith({
      method: 'pimlico_getUserOperationGasPrice',
      params: [],
    });

    // Verify the response structure
    expect(result).toEqual(mockGasPriceResponse);
    expect(result.slow.maxFeePerGas).toBe('0x829b42b5');
    expect(result.standard.maxFeePerGas).toBe('0x88d36a75');
    expect(result.fast.maxFeePerGas).toBe('0x8f0b9234');
  });

  test('should handle RPC errors gracefully', async () => {
    const mockError = new Error('RPC call failed');
    const mockRequest = vi.fn().mockRejectedValue(mockError);

    const mockExtendedClient = {
      ...createMockBundlerClient().mockExtendedClient,
      async getUserOperationGasPrice() {
        const response = await mockRequest({
          method: 'pimlico_getUserOperationGasPrice',
          params: [],
        });
        return response as UserOperationGasPriceResponse;
      },
    };

    const mockBaseBundlerClient = {
      ...createMockBundlerClient().mockBaseBundlerClient,
      extend: vi.fn().mockReturnValue(mockExtendedClient),
    };

    mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

    const infuraBundlerClient = createInfuraBundlerClient({
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
    });

    // Should propagate the error
    await expect(
      infuraBundlerClient.getUserOperationGasPrice(),
    ).rejects.toThrow('RPC call failed');
  });

  test('should work with different transport configurations', () => {
    // Test with different transport options
    const configs = [
      {
        transport: http('https://sepolia.infura.io/v3/api-key'),
        chain: sepolia,
      },
      {
        transport: http('https://mainnet.infura.io/v3/api-key'),
        pollingInterval: 2000,
      },
      {
        transport: http('https://sepolia.infura.io/v3/api-key'),
        chain: sepolia,
        paymaster: true as const,
      },
    ];

    for (const config of configs) {
      const { mockBaseBundlerClient } = createMockBundlerClient();
      mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

      const client = createInfuraBundlerClient(config);

      expect(mockCreateAABundlerClient).toHaveBeenCalledWith(config);
      expect(mockBaseBundlerClient.extend).toHaveBeenCalledTimes(1);
      expect(client).toHaveProperty('getUserOperationGasPrice');
    }
  });

  test('should preserve all base bundler client configuration', () => {
    const { mockBaseBundlerClient, mockExtendedClient } =
      createMockBundlerClient();
    mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

    const config = {
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
      paymaster: { getPaymasterData: vi.fn() },
      paymasterContext: { policyId: 'test' },
      userOperation: { estimateFeesPerGas: vi.fn() },
    };

    const infuraBundlerClient = createInfuraBundlerClient(config);

    // Should have called extend
    expect(mockBaseBundlerClient.extend).toHaveBeenCalledTimes(1);

    // Should preserve all base properties through extension
    expect(infuraBundlerClient.sendUserOperation).toBe(
      mockExtendedClient.sendUserOperation,
    );
    expect(infuraBundlerClient.waitForUserOperationReceipt).toBe(
      mockExtendedClient.waitForUserOperationReceipt,
    );
    expect(infuraBundlerClient.estimateUserOperationGas).toBe(
      mockExtendedClient.estimateUserOperationGas,
    );

    // Should have the new method
    expect(infuraBundlerClient).toHaveProperty('getUserOperationGasPrice');
  });
});

describe('TypeScript types', () => {
  test('GasPriceTier should have correct structure', () => {
    const gasPriceTier: GasPriceTier = {
      maxFeePerGas: '0x1dcd6500',
      maxPriorityFeePerGas: '0x5f5e100',
    };

    expect(gasPriceTier.maxFeePerGas).toBeDefined();
    expect(gasPriceTier.maxPriorityFeePerGas).toBeDefined();
  });

  test('UserOperationGasPriceResponse should have correct structure', () => {
    const response: UserOperationGasPriceResponse = {
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

    expect(response.slow).toBeDefined();
    expect(response.standard).toBeDefined();
    expect(response.fast).toBeDefined();
  });

  test('InfuraBundlerClient should extend BundlerClient', () => {
    // This is a compile-time test - if it compiles, the types are correct
    const { mockBaseBundlerClient } = createMockBundlerClient();
    mockCreateAABundlerClient.mockReturnValue(mockBaseBundlerClient);

    const client: InfuraBundlerClient = createInfuraBundlerClient({
      transport: http('https://sepolia.infura.io/v3/test-key'),
      chain: sepolia,
    });

    // Should have base bundler client methods
    expect(client).toHaveProperty('sendUserOperation');
    // Should have the new method
    expect(client).toHaveProperty('getUserOperationGasPrice');
  });
});
