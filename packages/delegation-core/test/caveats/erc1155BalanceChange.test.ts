import { describe, it, expect } from 'vitest';

import {
  createERC1155BalanceChangeTerms,
  decodeERC1155BalanceChangeTerms,
} from '../../src/caveats/erc1155BalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('ERC1155BalanceChange', () => {
  describe('createERC1155BalanceChangeTerms', () => {
    const tokenAddress = '0x00000000000000000000000000000000000000cc';
    const recipient = '0x00000000000000000000000000000000000000dd';

    it('creates valid terms for balance change', () => {
      const result = createERC1155BalanceChangeTerms({
        tokenAddress,
        recipient,
        tokenId: 7n,
        balance: 3n,
        changeType: BalanceChangeType.Decrease,
      });

      expect(result).toStrictEqual(
        '0x01' +
          '00000000000000000000000000000000000000cc' +
          '00000000000000000000000000000000000000dd' +
          '0000000000000000000000000000000000000000000000000000000000000007' +
          '0000000000000000000000000000000000000000000000000000000000000003',
      );
    });

    it('throws for invalid tokenId', () => {
      expect(() =>
        createERC1155BalanceChangeTerms({
          tokenAddress,
          recipient,
          tokenId: -1n,
          balance: 1n,
          changeType: BalanceChangeType.Increase,
        }),
      ).toThrow('Invalid tokenId: must be a non-negative number');
    });

    it('throws for invalid balance', () => {
      expect(() =>
        createERC1155BalanceChangeTerms({
          tokenAddress,
          recipient,
          tokenId: 1n,
          balance: 0n,
          changeType: BalanceChangeType.Increase,
        }),
      ).toThrow('Invalid balance: must be a positive number');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createERC1155BalanceChangeTerms(
        {
          tokenAddress,
          recipient,
          tokenId: 1n,
          balance: 1n,
          changeType: BalanceChangeType.Increase,
        },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(105);
    });
  });

  describe('decodeERC1155BalanceChangeTerms', () => {
    const tokenAddress =
      '0x00000000000000000000000000000000000000cc' as `0x${string}`;
    const recipient =
      '0x00000000000000000000000000000000000000dd' as `0x${string}`;

    it('decodes full terms', () => {
      const original = {
        tokenAddress,
        recipient,
        tokenId: 7n,
        balance: 3n,
        changeType: BalanceChangeType.Decrease,
      };
      const decoded = decodeERC1155BalanceChangeTerms(
        createERC1155BalanceChangeTerms(original),
      );
      expect(decoded.tokenId).toBe(7n);
      expect(decoded.balance).toBe(3n);
      expect(decoded.changeType).toBe(BalanceChangeType.Decrease);
      expect((decoded.tokenAddress as string).toLowerCase()).toBe(
        tokenAddress.toLowerCase(),
      );
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenAddress,
        recipient,
        tokenId: 1n,
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      };
      const bytes = createERC1155BalanceChangeTerms(original, { out: 'bytes' });
      const decoded = decodeERC1155BalanceChangeTerms(bytes);
      expect(decoded.tokenId).toBe(1n);
      expect(decoded.balance).toBe(1n);
    });

    it('throws when encoded terms are not exactly 105 bytes', () => {
      expect(() =>
        decodeERC1155BalanceChangeTerms(`0x${'00'.repeat(104)}`),
      ).toThrow(
        'Invalid ERC1155BalanceChange terms: must be exactly 105 bytes',
      );
    });
  });
});
