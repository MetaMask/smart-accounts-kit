import { describe, it, expect } from 'vitest';

import {
  createERC20BalanceChangeTerms,
  decodeERC20BalanceChangeTerms,
} from '../../src/caveats/erc20BalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('ERC20BalanceChange', () => {
  describe('createERC20BalanceChangeTerms', () => {
    const tokenAddress = '0x00000000000000000000000000000000000000dd';
    const recipient = '0x00000000000000000000000000000000000000ee';

    it('creates valid terms for balance decrease', () => {
      const result = createERC20BalanceChangeTerms({
        tokenAddress,
        recipient,
        balance: 5n,
        changeType: BalanceChangeType.Decrease,
      });

      expect(result).toStrictEqual(
        '0x01' +
          '00000000000000000000000000000000000000dd' +
          '00000000000000000000000000000000000000ee' +
          '0000000000000000000000000000000000000000000000000000000000000005',
      );
    });

    it('throws for invalid token address', () => {
      expect(() =>
        createERC20BalanceChangeTerms({
          tokenAddress: '0x1234',
          recipient,
          balance: 1n,
          changeType: BalanceChangeType.Increase,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws for invalid balance', () => {
      expect(() =>
        createERC20BalanceChangeTerms({
          tokenAddress,
          recipient,
          balance: 0n,
          changeType: BalanceChangeType.Increase,
        }),
      ).toThrow('Invalid balance: must be a positive number');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createERC20BalanceChangeTerms(
        {
          tokenAddress,
          recipient,
          balance: 1n,
          changeType: BalanceChangeType.Increase,
        },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(73);
    });
  });

  describe('decodeERC20BalanceChangeTerms', () => {
    const tokenAddress =
      '0x00000000000000000000000000000000000000dd' as `0x${string}`;
    const recipient =
      '0x00000000000000000000000000000000000000ee' as `0x${string}`;

    it('decodes decrease balance change', () => {
      const original = {
        tokenAddress,
        recipient,
        balance: 5n,
        changeType: BalanceChangeType.Decrease,
      };
      const decoded = decodeERC20BalanceChangeTerms(
        createERC20BalanceChangeTerms(original),
      );
      expect(decoded.changeType).toBe(original.changeType);
      expect((decoded.tokenAddress as string).toLowerCase()).toBe(
        tokenAddress.toLowerCase(),
      );
      expect((decoded.recipient as string).toLowerCase()).toBe(
        recipient.toLowerCase(),
      );
      expect(decoded.balance).toBe(original.balance);
    });

    it('decodes increase balance change', () => {
      const original = {
        tokenAddress,
        recipient,
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      };
      const decoded = decodeERC20BalanceChangeTerms(
        createERC20BalanceChangeTerms(original),
      );
      expect(decoded.changeType).toBe(BalanceChangeType.Increase);
      expect(decoded.balance).toBe(1n);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenAddress,
        recipient,
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      };
      const bytes = createERC20BalanceChangeTerms(original, { out: 'bytes' });
      const decoded = decodeERC20BalanceChangeTerms(bytes);
      expect(decoded.balance).toBe(1n);
    });

    it('throws when encoded terms are not exactly 73 bytes', () => {
      expect(() =>
        decodeERC20BalanceChangeTerms(`0x${'00'.repeat(72)}`),
      ).toThrow('Invalid ERC20BalanceChange terms: must be exactly 73 bytes');
    });
  });
});
