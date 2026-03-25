import { describe, it, expect } from 'vitest';

import {
  createERC721BalanceChangeTerms,
  decodeERC721BalanceChangeTerms,
} from '../../src/caveats/erc721BalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('ERC721BalanceChange', () => {
  describe('createERC721BalanceChangeTerms', () => {
    const tokenAddress = '0x00000000000000000000000000000000000000aa';
    const recipient = '0x00000000000000000000000000000000000000bb';

    it('creates valid terms for balance increase', () => {
      const result = createERC721BalanceChangeTerms({
        tokenAddress,
        recipient,
        amount: 1n,
        changeType: BalanceChangeType.Increase,
      });

      expect(result).toStrictEqual(
        '0x00' +
          '00000000000000000000000000000000000000aa' +
          '00000000000000000000000000000000000000bb' +
          '0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('throws for invalid recipient', () => {
      expect(() =>
        createERC721BalanceChangeTerms({
          tokenAddress,
          recipient: '0x1234',
          amount: 1n,
          changeType: BalanceChangeType.Increase,
        }),
      ).toThrow('Invalid recipient: must be a valid address');
    });

    it('throws for invalid amount', () => {
      expect(() =>
        createERC721BalanceChangeTerms({
          tokenAddress,
          recipient,
          amount: 0n,
          changeType: BalanceChangeType.Decrease,
        }),
      ).toThrow('Invalid balance: must be a positive number');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createERC721BalanceChangeTerms(
        {
          tokenAddress,
          recipient,
          amount: 2n,
          changeType: BalanceChangeType.Decrease,
        },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(73);
    });
  });

  describe('decodeERC721BalanceChangeTerms', () => {
    const tokenAddress =
      '0x00000000000000000000000000000000000000aa' as `0x${string}`;
    const recipient =
      '0x00000000000000000000000000000000000000bb' as `0x${string}`;

    it('decodes increase', () => {
      const original = {
        tokenAddress,
        recipient,
        amount: 1n,
        changeType: BalanceChangeType.Increase,
      };
      const decoded = decodeERC721BalanceChangeTerms(
        createERC721BalanceChangeTerms(original),
      );
      expect(decoded.changeType).toBe(BalanceChangeType.Increase);
      expect((decoded.tokenAddress as string).toLowerCase()).toBe(
        tokenAddress.toLowerCase(),
      );
      expect((decoded.recipient as string).toLowerCase()).toBe(
        recipient.toLowerCase(),
      );
      expect(decoded.amount).toBe(1n);
    });

    it('decodes decrease', () => {
      const original = {
        tokenAddress,
        recipient,
        amount: 2n,
        changeType: BalanceChangeType.Decrease,
      };
      const decoded = decodeERC721BalanceChangeTerms(
        createERC721BalanceChangeTerms(original),
      );
      expect(decoded.changeType).toBe(BalanceChangeType.Decrease);
      expect(decoded.amount).toBe(2n);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenAddress,
        recipient,
        amount: 2n,
        changeType: BalanceChangeType.Decrease,
      };
      const bytes = createERC721BalanceChangeTerms(original, { out: 'bytes' });
      expect(decodeERC721BalanceChangeTerms(bytes).amount).toBe(2n);
    });

    it('throws when encoded terms are not exactly 73 bytes', () => {
      expect(() =>
        decodeERC721BalanceChangeTerms(`0x${'00'.repeat(72)}`),
      ).toThrow('Invalid ERC721BalanceChange terms: must be exactly 73 bytes');
    });
  });
});
