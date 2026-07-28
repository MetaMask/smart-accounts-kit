import { createPublicClient, http } from 'viem';
import type { Address, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as ERC20TransferAmountEnforcer from '../../../src/DelegationFramework/ERC20TransferAmountEnforcer';
import { randomAddress, randomBytes } from '../../utils';

// Helper function to generate random bytes32
const randomBytes32 = (): Hex => randomBytes(32);

// Mock the readContract function
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

describe('ERC20TransferAmountEnforcer read functions', () => {
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
    delegationHash = randomBytes32();
    terms =
      '0x1234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000001';

    vi.clearAllMocks();
  });

  describe('getTermsInfo', () => {
    it('should call readContract with correct parameters and return terms info', async () => {
      const mockAllowedContract = randomAddress();
      const mockMaxTokens = 1000000n;

      vi.mocked(readContract).mockResolvedValue([
        mockAllowedContract,
        mockMaxTokens,
      ]);

      const result = await ERC20TransferAmountEnforcer.read.getTermsInfo({
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

      expect(result).toEqual({
        allowedContract: mockAllowedContract,
        maxTokens: mockMaxTokens,
      });
    });

    it('should handle different terms values', async () => {
      const mockAllowedContract = randomAddress();
      const mockMaxTokens = 500000n;
      const differentTerms =
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd000000000000000000000000000000000000000000000000000000000000002';

      vi.mocked(readContract).mockResolvedValue([
        mockAllowedContract,
        mockMaxTokens,
      ]);

      const result = await ERC20TransferAmountEnforcer.read.getTermsInfo({
        client,
        contractAddress,
        terms: differentTerms,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'getTermsInfo',
        args: [differentTerms],
      });

      expect(result).toEqual({
        allowedContract: mockAllowedContract,
        maxTokens: mockMaxTokens,
      });
    });
  });

  describe('getSpentAmount', () => {
    it('should call readContract with correct parameters and return spent amount', async () => {
      const mockSpentAmount = 250000n;

      vi.mocked(readContract).mockResolvedValue(mockSpentAmount);

      const result = await ERC20TransferAmountEnforcer.read.getSpentAmount({
        client,
        contractAddress,
        delegationManager,
        delegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'spentMap',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockSpentAmount);
    });

    it('should handle zero spent amount', async () => {
      const mockSpentAmount = 0n;

      vi.mocked(readContract).mockResolvedValue(mockSpentAmount);

      const result = await ERC20TransferAmountEnforcer.read.getSpentAmount({
        client,
        contractAddress,
        delegationManager,
        delegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'spentMap',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockSpentAmount);
    });

    it('should handle different delegation parameters', async () => {
      const differentDelegationManager = randomAddress();
      const differentDelegationHash = randomBytes32();
      const mockSpentAmount = 750000n;

      vi.mocked(readContract).mockResolvedValue(mockSpentAmount);

      const result = await ERC20TransferAmountEnforcer.read.getSpentAmount({
        client,
        contractAddress,
        delegationManager: differentDelegationManager,
        delegationHash: differentDelegationHash,
      });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'spentMap',
        args: [differentDelegationManager, differentDelegationHash],
      });

      expect(result).toBe(mockSpentAmount);
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(ERC20TransferAmountEnforcer.read.getTermsInfo).toBeDefined();
      expect(ERC20TransferAmountEnforcer.read.getSpentAmount).toBeDefined();
      expect(typeof ERC20TransferAmountEnforcer.read.getTermsInfo).toBe(
        'function',
      );
      expect(typeof ERC20TransferAmountEnforcer.read.getSpentAmount).toBe(
        'function',
      );
    });
  });
});
