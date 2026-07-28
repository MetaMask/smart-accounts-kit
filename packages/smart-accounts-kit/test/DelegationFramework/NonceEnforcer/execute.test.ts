import { createWalletClient, http } from 'viem';
import type { Address, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as viemActions from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as NonceEnforcer from '../../../src/DelegationFramework/NonceEnforcer';
import { randomAddress } from '../../utils';

// Mock the viem functions
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    encodeFunctionData: vi.fn(),
  };
});

vi.mock('viem/actions', () => ({
  simulateContract: vi.fn(),
  writeContract: vi.fn(),
}));

describe('NonceEnforcer execute functions', () => {
  let client: any;
  let contractAddress: Address;
  let delegationManager: Address;

  beforeEach(() => {
    const account = privateKeyToAccount(generatePrivateKey());
    client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(),
    });

    contractAddress = randomAddress();
    delegationManager = randomAddress();

    vi.clearAllMocks();
  });

  describe('encode incrementNonce', () => {
    it('should call encodeFunctionData with correct parameters', async () => {
      const mockEncodedData = '0x1234567890abcdef';

      const { encodeFunctionData } = await import('viem');
      vi.mocked(encodeFunctionData).mockReturnValue(mockEncodedData);

      const result = NonceEnforcer.encode.incrementNonce(delegationManager);

      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(result).toBe(mockEncodedData);
    });

    it('should handle different delegation manager addresses', async () => {
      const testAddresses = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x0000000000000000000000000000000000000000',
        randomAddress(),
      ] as const;

      const { encodeFunctionData } = await import('viem');

      testAddresses.forEach((address) => {
        const mockData = `0x${address.slice(2)}`;
        vi.mocked(encodeFunctionData).mockReturnValue(mockData as Hex);

        const result = NonceEnforcer.encode.incrementNonce(address);

        expect(encodeFunctionData).toHaveBeenCalledWith({
          abi: expect.any(Array),
          functionName: 'incrementNonce',
          args: [address],
        });

        expect(result).toBe(mockData);
      });
    });
  });

  describe('simulate incrementNonce', () => {
    it('should call simulateContract with correct parameters', async () => {
      const mockRequest = { to: contractAddress, data: '0x123' };
      const mockSimulateResult = { request: mockRequest, result: undefined };

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );

      const result = await NonceEnforcer.simulate.incrementNonce({
        client,
        contractAddress,
        delegationManager,
      });

      expect(viemActions.simulateContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(result).toBe(mockSimulateResult);
    });

    it('should handle simulation errors', async () => {
      const mockError = new Error('Simulation failed');

      vi.mocked(viemActions.simulateContract).mockRejectedValue(mockError);

      await expect(
        NonceEnforcer.simulate.incrementNonce({
          client,
          contractAddress,
          delegationManager,
        }),
      ).rejects.toThrow('Simulation failed');
    });

    it('should work with different delegation managers', async () => {
      const differentManager = randomAddress();
      const mockRequest = { to: contractAddress, data: '0x456' };
      const mockSimulateResult = { request: mockRequest, result: undefined };

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );

      const result = await NonceEnforcer.simulate.incrementNonce({
        client,
        contractAddress,
        delegationManager: differentManager,
      });

      expect(viemActions.simulateContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [differentManager],
      });

      expect(result).toBe(mockSimulateResult);
    });
  });

  describe('execute incrementNonce', () => {
    it('should call writeContract with correct parameters', async () => {
      const mockHash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
      const mockRequest = { to: contractAddress, data: '0x123' };
      const mockSimulateResult = { request: mockRequest, result: undefined };

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );
      vi.mocked(viemActions.writeContract).mockResolvedValue(mockHash);

      const result = await NonceEnforcer.execute.incrementNonce({
        client,
        contractAddress,
        delegationManager,
      });

      expect(viemActions.simulateContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(viemActions.writeContract).toHaveBeenCalledWith(
        client,
        mockRequest,
      );

      expect(result).toBe(mockHash);
    });

    it('should handle execute errors', async () => {
      const mockError = new Error('Transaction failed');
      const mockRequest = { to: contractAddress, data: '0x123' };
      const mockSimulateResult = { request: mockRequest, result: undefined };

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );
      vi.mocked(viemActions.writeContract).mockRejectedValue(mockError);

      await expect(
        NonceEnforcer.execute.incrementNonce({
          client,
          contractAddress,
          delegationManager,
        }),
      ).rejects.toThrow('Transaction failed');
    });

    it('should work with different contract addresses', async () => {
      const differentContract = randomAddress();
      const mockHash =
        '0x1111111111111111111111111111111111111111111111111111111111111111';
      const mockRequest = { to: differentContract, data: '0x456' };
      const mockSimulateResult = { request: mockRequest, result: undefined };

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );
      vi.mocked(viemActions.writeContract).mockResolvedValue(mockHash);

      const result = await NonceEnforcer.execute.incrementNonce({
        client,
        contractAddress: differentContract,
        delegationManager,
      });

      expect(viemActions.simulateContract).toHaveBeenCalledWith(client, {
        address: differentContract,
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(viemActions.writeContract).toHaveBeenCalledWith(
        client,
        mockRequest,
      );

      expect(result).toBe(mockHash);
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(NonceEnforcer.encode.incrementNonce).toBeDefined();
      expect(NonceEnforcer.simulate.incrementNonce).toBeDefined();
      expect(NonceEnforcer.execute.incrementNonce).toBeDefined();

      expect(typeof NonceEnforcer.encode.incrementNonce).toBe('function');
      expect(typeof NonceEnforcer.simulate.incrementNonce).toBe('function');
      expect(typeof NonceEnforcer.execute.incrementNonce).toBe('function');
    });

    it('should have proper function signatures', () => {
      // encode is synchronous
      expect(NonceEnforcer.encode.incrementNonce.constructor.name).toBe(
        'Function',
      );

      // simulate and execute are async
      expect(NonceEnforcer.simulate.incrementNonce.constructor.name).toBe(
        'AsyncFunction',
      );
      expect(NonceEnforcer.execute.incrementNonce.constructor.name).toBe(
        'AsyncFunction',
      );
    });
  });

  describe('integration scenarios', () => {
    it('should support encode -> simulate -> execute workflow', async () => {
      const mockEncodedData = '0xabcd1234';
      const mockRequest = { to: contractAddress, data: mockEncodedData };
      const mockSimulateResult = { request: mockRequest, result: undefined };
      const mockHash =
        '0x9999999999999999999999999999999999999999999999999999999999999999';

      const { encodeFunctionData } = await import('viem');
      vi.mocked(encodeFunctionData).mockReturnValue(mockEncodedData);

      vi.mocked(viemActions.simulateContract).mockResolvedValue(
        mockSimulateResult as any,
      );
      vi.mocked(viemActions.writeContract).mockResolvedValue(mockHash);

      // Step 1: Encode
      const encodedData =
        NonceEnforcer.encode.incrementNonce(delegationManager);
      expect(encodedData).toBe(mockEncodedData);

      // Step 2: Simulate
      const request = await NonceEnforcer.simulate.incrementNonce({
        client,
        contractAddress,
        delegationManager,
      });
      expect(request).toBe(mockSimulateResult);

      // Step 3: Execute
      const hash = await NonceEnforcer.execute.incrementNonce({
        client,
        contractAddress,
        delegationManager,
      });
      expect(hash).toBe(mockHash);

      // Verify all functions were called with correct parameters
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(viemActions.simulateContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'incrementNonce',
        args: [delegationManager],
      });

      expect(viemActions.writeContract).toHaveBeenCalledWith(
        client,
        mockRequest,
      );
    });
  });
});
