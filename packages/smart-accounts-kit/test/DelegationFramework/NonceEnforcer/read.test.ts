import { createPublicClient, http } from 'viem';
import type { Address, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as NonceEnforcer from '../../../src/DelegationFramework/NonceEnforcer';
import { randomAddress } from '../../utils';

// Mock the readContract function
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

describe('NonceEnforcer read functions', () => {
  let client: any;
  let contractAddress: Address;
  let delegationManager: Address;
  let delegator: Address;
  let terms: Hex;

  beforeEach(() => {
    client = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    contractAddress = randomAddress();
    delegationManager = randomAddress();
    delegator = randomAddress();
    // Terms for nonce 123 (32 bytes)
    terms =
      '0x000000000000000000000000000000000000000000000000000000000000007b';

    vi.clearAllMocks();
  });

  describe('getTermsInfo', () => {
    it('should call readContract with correct parameters and return nonce', async () => {
      const mockNonce = 123n;

      vi.mocked(readContract).mockResolvedValue(mockNonce);

      const result = await NonceEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [terms],
      });

      expect(result).toBe(mockNonce);
    });

    it('should handle different nonce values in terms', async () => {
      const testCases: { nonce: bigint; terms: Hex }[] = [
        {
          nonce: 0n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        {
          nonce: 1n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
        {
          nonce: 42n,
          terms:
            '0x000000000000000000000000000000000000000000000000000000000000002a',
        },
        {
          nonce: 1000n,
          terms:
            '0x00000000000000000000000000000000000000000000000000000000000003e8',
        },
        {
          nonce: 2n ** 32n - 1n, // Max uint32
          terms:
            '0x00000000000000000000000000000000000000000000000000000000ffffffff',
        },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.nonce);

        const result = await NonceEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms: testCase.terms,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'getTermsInfo',
          args: [testCase.terms],
        });

        expect(result).toBe(testCase.nonce);
        vi.clearAllMocks();
      }
    });

    it('should handle large nonce values', async () => {
      const largeNonce = 2n ** 255n; // Large uint256
      const largeNonceTerms: Hex =
        '0x8000000000000000000000000000000000000000000000000000000000000000';

      vi.mocked(readContract).mockResolvedValue(largeNonce);

      const result = await NonceEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms: largeNonceTerms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [largeNonceTerms],
      });

      expect(result).toBe(largeNonce);
    });

    it('should propagate readContract errors', async () => {
      const mockError = new Error('Invalid terms length');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        NonceEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        }),
      ).rejects.toThrow('Invalid terms length');
    });
  });

  describe('currentNonce', () => {
    it('should call readContract with correct parameters and return current nonce', async () => {
      const mockCurrentNonce = 5n;

      vi.mocked(readContract).mockResolvedValue(mockCurrentNonce);

      const result = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager,
        delegator,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'currentNonce',
        args: [delegationManager, delegator],
      });

      expect(result).toBe(mockCurrentNonce);
    });

    it('should handle different current nonce values', async () => {
      const testCases = [
        { nonce: 0n, description: 'initial nonce' },
        { nonce: 1n, description: 'first increment' },
        { nonce: 10n, description: 'multiple increments' },
        { nonce: 100n, description: 'many increments' },
        { nonce: 2n ** 32n - 1n, description: 'max uint32 nonce' },
        { nonce: 2n ** 256n - 1n, description: 'max uint256 nonce' },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.nonce);

        const result = await NonceEnforcer.read.currentNonce({
          client,
          contractAddress,
          delegationManager,
          delegator,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'currentNonce',
          args: [delegationManager, delegator],
        });

        expect(result).toBe(testCase.nonce);
        vi.clearAllMocks();
      }
    });

    it('should handle different delegation manager and delegator combinations', async () => {
      const alternativeDelegationManager = randomAddress();
      const alternativeDelegator = randomAddress();
      const mockCurrentNonce = 7n;

      vi.mocked(readContract).mockResolvedValue(mockCurrentNonce);

      const result = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager: alternativeDelegationManager,
        delegator: alternativeDelegator,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'currentNonce',
        args: [alternativeDelegationManager, alternativeDelegator],
      });

      expect(result).toBe(mockCurrentNonce);
    });

    it('should handle zero nonce for new delegators', async () => {
      const mockCurrentNonce = 0n;

      vi.mocked(readContract).mockResolvedValue(mockCurrentNonce);

      const result = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager,
        delegator,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'currentNonce',
        args: [delegationManager, delegator],
      });

      expect(result).toBe(mockCurrentNonce);
    });

    it('should propagate readContract errors', async () => {
      const mockError = new Error('Network error');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        NonceEnforcer.read.currentNonce({
          client,
          contractAddress,
          delegationManager,
          delegator,
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(NonceEnforcer.read.getTermsInfo).toBeDefined();
      expect(NonceEnforcer.read.currentNonce).toBeDefined();
      expect(typeof NonceEnforcer.read.getTermsInfo).toBe('function');
      expect(typeof NonceEnforcer.read.currentNonce).toBe('function');
    });

    it('should have proper function signatures', () => {
      // Verify that the functions are async and return promises
      expect(NonceEnforcer.read.getTermsInfo.constructor.name).toBe(
        'AsyncFunction',
      );
      expect(NonceEnforcer.read.currentNonce.constructor.name).toBe(
        'AsyncFunction',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty terms gracefully', async () => {
      const emptyTerms: Hex = '0x';
      const mockNonce = 0n;

      vi.mocked(readContract).mockResolvedValue(mockNonce);

      const result = await NonceEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms: emptyTerms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [emptyTerms],
      });

      expect(result).toBe(mockNonce);
    });

    it('should handle zero addresses', async () => {
      const zeroAddress: Address = '0x0000000000000000000000000000000000000000';
      const mockCurrentNonce = 0n;

      vi.mocked(readContract).mockResolvedValue(mockCurrentNonce);

      const result = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager: zeroAddress,
        delegator: zeroAddress,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'currentNonce',
        args: [zeroAddress, zeroAddress],
      });

      expect(result).toBe(mockCurrentNonce);
    });

    it('should handle nonce isolation per delegator', async () => {
      const delegator1 = randomAddress();
      const delegator2 = randomAddress();
      const nonce1 = 5n;
      const nonce2 = 10n;

      // Mock different nonces for different delegators
      vi.mocked(readContract)
        .mockResolvedValueOnce(nonce1)
        .mockResolvedValueOnce(nonce2);

      const result1 = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager,
        delegator: delegator1,
      });

      const result2 = await NonceEnforcer.read.currentNonce({
        client,
        contractAddress,
        delegationManager,
        delegator: delegator2,
      });

      expect(result1).toBe(nonce1);
      expect(result2).toBe(nonce2);
      expect(readContract).toHaveBeenCalledTimes(2);
    });
  });
});
