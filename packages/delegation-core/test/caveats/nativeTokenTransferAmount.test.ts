import { describe, it, expect } from 'vitest';

import {
  createNativeTokenTransferAmountTerms,
  decodeNativeTokenTransferAmountTerms,
} from '../../src/caveats/nativeTokenTransferAmount';

describe('NativeTokenTransferAmount', () => {
  describe('createNativeTokenTransferAmountTerms', () => {
    it('creates valid terms for zero amount', () => {
      const result = createNativeTokenTransferAmountTerms({ maxAmount: 0n });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('creates valid terms for positive amount', () => {
      const result = createNativeTokenTransferAmountTerms({ maxAmount: 100n });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000064',
      );
    });

    it('throws for negative amount', () => {
      expect(() =>
        createNativeTokenTransferAmountTerms({ maxAmount: -1n }),
      ).toThrow('Invalid maxAmount: must be zero or positive');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createNativeTokenTransferAmountTerms(
        { maxAmount: 1n },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(32);
    });
  });

  describe('decodeNativeTokenTransferAmountTerms', () => {
    it('decodes zero amount', () => {
      expect(
        decodeNativeTokenTransferAmountTerms(
          createNativeTokenTransferAmountTerms({ maxAmount: 0n }),
        ),
      ).toStrictEqual({ maxAmount: 0n });
    });

    it('decodes positive amount', () => {
      expect(
        decodeNativeTokenTransferAmountTerms(
          createNativeTokenTransferAmountTerms({ maxAmount: 100n }),
        ),
      ).toStrictEqual({ maxAmount: 100n });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createNativeTokenTransferAmountTerms(
        { maxAmount: 1n },
        { out: 'bytes' },
      );
      expect(decodeNativeTokenTransferAmountTerms(bytes)).toStrictEqual({
        maxAmount: 1n,
      });
    });
  });
});
