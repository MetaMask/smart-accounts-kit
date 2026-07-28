import { createPublicClient, http } from 'viem';
import type { Address, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as LimitedCallsEnforcer from '../../../src/DelegationFramework/LimitedCallsEnforcer';
import { randomAddress } from '../../utils';

// Mock the readContract function
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

describe('LimitedCallsEnforcer read functions', () => {
  let client: any;
  let contractAddress: Address;
  let delegationManager: Address;
  let delegationHash: Hex;
  let terms: Hex;

  beforeEach(() => {
    client = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    contractAddress = randomAddress();
    delegationManager = randomAddress();
    delegationHash =
      '0x1234567890123456789012345678901234567890123456789012345678901234';
    // Terms for limit 5 (32 bytes)
    terms =
      '0x0000000000000000000000000000000000000000000000000000000000000005';

    vi.clearAllMocks();
  });

  describe('getTermsInfo', () => {
    it('should call readContract with correct parameters and return limit', async () => {
      const mockLimit = 5n;

      vi.mocked(readContract).mockResolvedValue(mockLimit);

      const result = await LimitedCallsEnforcer.read.getTermsInfo({
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

      expect(result).toBe(mockLimit);
    });

    it('should handle different limit values in terms', async () => {
      const testCases: { limit: bigint; terms: Hex }[] = [
        {
          limit: 0n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        {
          limit: 1n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
        {
          limit: 10n,
          terms:
            '0x000000000000000000000000000000000000000000000000000000000000000a',
        },
        {
          limit: 100n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000064',
        },
        {
          limit: 2n ** 32n - 1n, // Max uint32
          terms:
            '0x00000000000000000000000000000000000000000000000000000000ffffffff',
        },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.limit);

        const result = await LimitedCallsEnforcer.read.getTermsInfo({
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

        expect(result).toBe(testCase.limit);
        vi.clearAllMocks();
      }
    });

    it('should handle large limit values', async () => {
      const largeLimit = 2n ** 255n; // Large uint256
      const largeLimitTerms: Hex =
        '0x8000000000000000000000000000000000000000000000000000000000000000';

      vi.mocked(readContract).mockResolvedValue(largeLimit);

      const result = await LimitedCallsEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms: largeLimitTerms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [largeLimitTerms],
      });

      expect(result).toBe(largeLimit);
    });

    it('should propagate readContract errors', async () => {
      const mockError = new Error('Invalid terms length');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        LimitedCallsEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        }),
      ).rejects.toThrow('Invalid terms length');
    });
  });

  describe('callCounts', () => {
    it('should call readContract with correct parameters and return call count', async () => {
      const mockCallCount = 3n;

      vi.mocked(readContract).mockResolvedValue(mockCallCount);

      const result = await LimitedCallsEnforcer.read.callCounts({
        client,
        contractAddress,
        delegationManager,
        delegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'callCounts',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockCallCount);
    });

    it('should handle different call count values', async () => {
      const testCases = [
        { callCount: 0n, description: 'no calls made yet' },
        { callCount: 1n, description: 'first call' },
        { callCount: 5n, description: 'multiple calls' },
        { callCount: 100n, description: 'many calls' },
        { callCount: 2n ** 32n - 1n, description: 'max uint32 calls' },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.callCount);

        const result = await LimitedCallsEnforcer.read.callCounts({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'callCounts',
          args: [delegationManager, delegationHash],
        });

        expect(result).toBe(testCase.callCount);
        vi.clearAllMocks();
      }
    });

    it('should handle different delegation manager and hash combinations', async () => {
      const alternativeDelegationManager = randomAddress();
      const alternativeDelegationHash =
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef';
      const mockCallCount = 7n;

      vi.mocked(readContract).mockResolvedValue(mockCallCount);

      const result = await LimitedCallsEnforcer.read.callCounts({
        client,
        contractAddress,
        delegationManager: alternativeDelegationManager,
        delegationHash: alternativeDelegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'callCounts',
        args: [alternativeDelegationManager, alternativeDelegationHash],
      });

      expect(result).toBe(mockCallCount);
    });

    it('should handle zero call count for new delegations', async () => {
      const mockCallCount = 0n;

      vi.mocked(readContract).mockResolvedValue(mockCallCount);

      const result = await LimitedCallsEnforcer.read.callCounts({
        client,
        contractAddress,
        delegationManager,
        delegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'callCounts',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockCallCount);
    });

    it('should propagate readContract errors', async () => {
      const mockError = new Error('Network error');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        LimitedCallsEnforcer.read.callCounts({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(LimitedCallsEnforcer.read.getTermsInfo).toBeDefined();
      expect(LimitedCallsEnforcer.read.callCounts).toBeDefined();
      expect(typeof LimitedCallsEnforcer.read.getTermsInfo).toBe('function');
      expect(typeof LimitedCallsEnforcer.read.callCounts).toBe('function');
    });

    it('should have proper function signatures', () => {
      // Verify that the functions are async and return promises
      expect(LimitedCallsEnforcer.read.getTermsInfo.constructor.name).toBe(
        'AsyncFunction',
      );
      expect(LimitedCallsEnforcer.read.callCounts.constructor.name).toBe(
        'AsyncFunction',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty terms gracefully', async () => {
      const emptyTerms: Hex = '0x';
      const mockLimit = 0n;

      vi.mocked(readContract).mockResolvedValue(mockLimit);

      const result = await LimitedCallsEnforcer.read.getTermsInfo({
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

      expect(result).toBe(mockLimit);
    });

    it('should handle zero addresses', async () => {
      const zeroAddress: Address = '0x0000000000000000000000000000000000000000';
      const zeroHash: Hex =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const mockCallCount = 0n;

      vi.mocked(readContract).mockResolvedValue(mockCallCount);

      const result = await LimitedCallsEnforcer.read.callCounts({
        client,
        contractAddress,
        delegationManager: zeroAddress,
        delegationHash: zeroHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'callCounts',
        args: [zeroAddress, zeroHash],
      });

      expect(result).toBe(mockCallCount);
    });

    it('should handle maximum delegation hash values', async () => {
      const maxHash: Hex =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const mockCallCount = 42n;

      vi.mocked(readContract).mockResolvedValue(mockCallCount);

      const result = await LimitedCallsEnforcer.read.callCounts({
        client,
        contractAddress,
        delegationManager,
        delegationHash: maxHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'callCounts',
        args: [delegationManager, maxHash],
      });

      expect(result).toBe(mockCallCount);
    });
  });
});
