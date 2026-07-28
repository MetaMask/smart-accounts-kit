import { createPublicClient, http } from 'viem';
import type { Address, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as IdEnforcer from '../../../src/DelegationFramework/IdEnforcer';
import { randomAddress } from '../../utils';

// Mock the readContract function
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

describe('IdEnforcer read functions', () => {
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
    // Terms for ID 123 (32 bytes)
    terms =
      '0x000000000000000000000000000000000000000000000000000000000000007b';

    vi.clearAllMocks();
  });

  describe('getTermsInfo', () => {
    it('should call readContract with correct parameters and return id', async () => {
      const mockId = 123n;

      vi.mocked(readContract).mockResolvedValue(mockId);

      const result = await IdEnforcer.read.getTermsInfo({
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

      expect(result).toBe(mockId);
    });

    it('should handle different ID values in terms', async () => {
      const testCases: { id: bigint; terms: Hex }[] = [
        {
          id: 0n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        {
          id: 1n,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
        {
          id: 999n,
          terms:
            '0x00000000000000000000000000000000000000000000000000000000000003e7',
        },
        {
          id: 2n ** 32n - 1n, // Max uint32
          terms:
            '0x00000000000000000000000000000000000000000000000000000000ffffffff',
        },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.id);

        const result = await IdEnforcer.read.getTermsInfo({
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

        expect(result).toBe(testCase.id);
        vi.clearAllMocks();
      }
    });

    it('should handle large ID values', async () => {
      const largeId = 2n ** 255n; // Large uint256
      const largeIdTerms: Hex =
        '0x8000000000000000000000000000000000000000000000000000000000000000';

      vi.mocked(readContract).mockResolvedValue(largeId);

      const result = await IdEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms: largeIdTerms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [largeIdTerms],
      });

      expect(result).toBe(largeId);
    });

    it('should propagate readContract errors', async () => {
      const mockError = new Error('Invalid terms length');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        IdEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        }),
      ).rejects.toThrow('Invalid terms length');
    });
  });

  describe('getIsUsed', () => {
    it('should call readContract with correct parameters and return usage status', async () => {
      const id = 123n;
      const mockIsUsed = false;

      vi.mocked(readContract).mockResolvedValue(mockIsUsed);

      const result = await IdEnforcer.read.getIsUsed({
        client,
        contractAddress,
        delegationManager,
        delegator,
        id,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getIsUsed',
        args: [delegationManager, delegator, id],
      });

      expect(result).toBe(mockIsUsed);
    });

    it('should handle different usage states', async () => {
      const id = 456n;
      const testCases = [
        { isUsed: false, description: 'unused ID' },
        { isUsed: true, description: 'used ID' },
      ];

      for (const testCase of testCases) {
        vi.mocked(readContract).mockResolvedValue(testCase.isUsed);

        const result = await IdEnforcer.read.getIsUsed({
          client,
          contractAddress,
          delegationManager,
          delegator,
          id,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'getIsUsed',
          args: [delegationManager, delegator, id],
        });

        expect(result).toBe(testCase.isUsed);
        vi.clearAllMocks();
      }
    });

    it('should handle different delegator and delegation manager combinations', async () => {
      const id = 789n;
      const alternativeDelegationManager = randomAddress();
      const alternativeDelegator = randomAddress();
      const mockIsUsed = true;

      vi.mocked(readContract).mockResolvedValue(mockIsUsed);

      const result = await IdEnforcer.read.getIsUsed({
        client,
        contractAddress,
        delegationManager: alternativeDelegationManager,
        delegator: alternativeDelegator,
        id,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getIsUsed',
        args: [alternativeDelegationManager, alternativeDelegator, id],
      });

      expect(result).toBe(mockIsUsed);
    });

    it('should handle different ID values', async () => {
      const testIds = [0n, 1n, 42n, 999n, 2n ** 32n - 1n, 2n ** 255n];
      const mockIsUsed = false;

      for (const testId of testIds) {
        vi.mocked(readContract).mockResolvedValue(mockIsUsed);

        const result = await IdEnforcer.read.getIsUsed({
          client,
          contractAddress,
          delegationManager,
          delegator,
          id: testId,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'getIsUsed',
          args: [delegationManager, delegator, testId],
        });

        expect(result).toBe(mockIsUsed);
        vi.clearAllMocks();
      }
    });

    it('should propagate readContract errors', async () => {
      const id = 123n;

      const mockError = new Error('Network error');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        IdEnforcer.read.getIsUsed({
          client,
          contractAddress,
          delegationManager,
          delegator,
          id,
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(IdEnforcer.read.getTermsInfo).toBeDefined();
      expect(IdEnforcer.read.getIsUsed).toBeDefined();
      expect(typeof IdEnforcer.read.getTermsInfo).toBe('function');
      expect(typeof IdEnforcer.read.getIsUsed).toBe('function');
    });

    it('should have proper function signatures', () => {
      // Verify that the functions are async and return promises
      expect(IdEnforcer.read.getTermsInfo.constructor.name).toBe(
        'AsyncFunction',
      );
      expect(IdEnforcer.read.getIsUsed.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('edge cases', () => {
    it('should handle empty terms gracefully', async () => {
      const emptyTerms: Hex = '0x';
      const mockId = 0n;

      vi.mocked(readContract).mockResolvedValue(mockId);

      const result = await IdEnforcer.read.getTermsInfo({
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

      expect(result).toBe(mockId);
    });

    it('should handle zero addresses', async () => {
      const zeroAddress: Address = '0x0000000000000000000000000000000000000000';
      const id = 123n;
      const mockIsUsed = false;

      vi.mocked(readContract).mockResolvedValue(mockIsUsed);

      const result = await IdEnforcer.read.getIsUsed({
        client,
        contractAddress,
        delegationManager: zeroAddress,
        delegator: zeroAddress,
        id,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getIsUsed',
        args: [zeroAddress, zeroAddress, id],
      });

      expect(result).toBe(mockIsUsed);
    });
  });
});
