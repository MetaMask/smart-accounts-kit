import { createPublicClient, http, concat, toHex } from 'viem';
import type { Address, Hex } from 'viem';
import { readContract } from 'viem/actions';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as SpecificActionERC20TransferBatchEnforcer from '../../../src/DelegationFramework/SpecificActionERC20TransferBatchEnforcer';
import { randomAddress } from '../../utils';

// Mock the readContract function
vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

describe('SpecificActionERC20TransferBatchEnforcer read functions', () => {
  let client: any;
  let contractAddress: Address;
  let delegationManager: Address;
  let delegationHash: Hex;

  beforeEach(() => {
    client = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    contractAddress = randomAddress();
    delegationManager = randomAddress();
    delegationHash =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';

    vi.clearAllMocks();
  });

  describe('usedDelegations', () => {
    it('should call readContract with correct parameters', async () => {
      const mockIsUsed = true;

      vi.mocked(readContract).mockResolvedValue(mockIsUsed);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        });

      expect(readContract).toHaveBeenCalledWith(client, {
        address: contractAddress,
        abi: expect.any(Array),
        functionName: 'usedDelegations',
        args: [delegationManager, delegationHash],
      });

      expect(result).toBe(mockIsUsed);
    });

    it('should return false for unused delegation', async () => {
      vi.mocked(readContract).mockResolvedValue(false);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        });

      expect(result).toBe(false);
    });

    it('should return true for used delegation', async () => {
      vi.mocked(readContract).mockResolvedValue(true);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        });

      expect(result).toBe(true);
    });

    it('should handle different delegation hashes', async () => {
      const testCases = [
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        '0xdeadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef',
      ];

      for (const hash of testCases) {
        vi.mocked(readContract).mockResolvedValue(false);

        await SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
          client,
          contractAddress,
          delegationManager,
          delegationHash: hash as Hex,
        });

        expect(readContract).toHaveBeenCalledWith(client, {
          address: contractAddress,
          abi: expect.any(Array),
          functionName: 'usedDelegations',
          args: [delegationManager, hash],
        });
      }
    });

    it('should handle errors from readContract', async () => {
      const mockError = new Error('Contract call failed');

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        SpecificActionERC20TransferBatchEnforcer.read.usedDelegations({
          client,
          contractAddress,
          delegationManager,
          delegationHash,
        }),
      ).rejects.toThrow('Contract call failed');
    });
  });

  describe('getTermsInfo', () => {
    it('should call readContract with correct parameters and decode terms', async () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const amount = 1000000000000000000n; // 1 ETH
      const firstTarget = randomAddress();
      const firstCalldata = '0x12345678';

      const mockTermsData = {
        tokenAddress,
        recipient,
        amount,
        firstTarget,
        firstCalldata,
      };

      // Create terms bytes: tokenAddress (20) + recipient (20) + amount (32) + firstTarget (20) + firstCalldata
      const terms = concat([
        tokenAddress,
        recipient,
        toHex(amount, { size: 32 }),
        firstTarget,
        firstCalldata,
      ]);

      vi.mocked(readContract).mockResolvedValue(mockTermsData);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
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

      expect(result).toEqual(mockTermsData);
    });

    it('should handle various term values', async () => {
      const testCases = [
        {
          tokenAddress: '0x1111111111111111111111111111111111111111' as Address,
          recipient: '0x2222222222222222222222222222222222222222' as Address,
          amount: 0n,
          firstTarget: '0x3333333333333333333333333333333333333333' as Address,
          firstCalldata: '0x' as Hex,
        },
        {
          tokenAddress: '0xA0b86a32c6F47E3c8cE14E2D0DB8c9eB4e3a0c8F' as Address,
          recipient: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as Address,
          amount: 2n ** 255n - 1n, // Max uint256
          firstTarget: '0x5555555555555555555555555555555555555555' as Address,
          firstCalldata: '0x1234567890abcdef' as Hex,
        },
        {
          tokenAddress: randomAddress(),
          recipient: randomAddress(),
          amount: 500000000000000000n, // 0.5 ETH
          firstTarget: randomAddress(),
          firstCalldata:
            '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' as Hex,
        },
      ];

      for (const testCase of testCases) {
        const terms = concat([
          testCase.tokenAddress,
          testCase.recipient,
          toHex(testCase.amount, { size: 32 }),
          testCase.firstTarget,
          testCase.firstCalldata,
        ]);

        vi.mocked(readContract).mockResolvedValue(testCase);

        const result =
          await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
            client,
            contractAddress,
            terms,
          });

        expect(result).toEqual(testCase);
      }
    });

    it('should handle empty calldata in terms', async () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const amount = 1000000000000000000n;
      const firstTarget = randomAddress();
      const firstCalldata = '0x';

      const mockTermsData = {
        tokenAddress,
        recipient,
        amount,
        firstTarget,
        firstCalldata,
      };

      const terms = concat([
        tokenAddress,
        recipient,
        toHex(amount, { size: 32 }),
        firstTarget,
        firstCalldata,
      ]);

      vi.mocked(readContract).mockResolvedValue(mockTermsData);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        });

      expect(result).toEqual(mockTermsData);
    });

    it('should handle complex calldata in terms', async () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const amount = 2500000000000000000n; // 2.5 ETH
      const firstTarget = randomAddress();
      // Complex calldata with multiple parameters
      const firstCalldata =
        '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000022b1c8c1227a0000' as Hex;

      const mockTermsData = {
        tokenAddress,
        recipient,
        amount,
        firstTarget,
        firstCalldata,
      };

      const terms = concat([
        tokenAddress,
        recipient,
        toHex(amount, { size: 32 }),
        firstTarget,
        firstCalldata,
      ]);

      vi.mocked(readContract).mockResolvedValue(mockTermsData);

      const result =
        await SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        });

      expect(result).toEqual(mockTermsData);
    });

    it('should handle errors from readContract', async () => {
      const mockError = new Error('Invalid terms length');
      const terms = '0x1234' as Hex; // Invalid short terms

      vi.mocked(readContract).mockRejectedValue(mockError);

      await expect(
        SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo({
          client,
          contractAddress,
          terms,
        }),
      ).rejects.toThrow('Invalid terms length');
    });
  });

  describe('API structure', () => {
    it('should export the expected functions', () => {
      expect(
        SpecificActionERC20TransferBatchEnforcer.read.usedDelegations,
      ).toBeDefined();
      expect(
        SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo,
      ).toBeDefined();

      expect(
        typeof SpecificActionERC20TransferBatchEnforcer.read.usedDelegations,
      ).toBe('function');
      expect(
        typeof SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo,
      ).toBe('function');
    });

    it('should have proper function signatures', () => {
      // Both functions are async
      expect(
        SpecificActionERC20TransferBatchEnforcer.read.usedDelegations
          .constructor.name,
      ).toBe('AsyncFunction');
      expect(
        SpecificActionERC20TransferBatchEnforcer.read.getTermsInfo.constructor
          .name,
      ).toBe('AsyncFunction');
    });
  });
});
