import { describe, it, expect } from 'vitest';

import {
  createNativeTokenPaymentTerms,
  decodeNativeTokenPaymentTerms,
} from '../../src/caveats/nativeTokenPayment';

describe('NativeTokenPayment', () => {
  describe('createNativeTokenPaymentTerms', () => {
    const recipient = '0x00000000000000000000000000000000000000bb';

    it('creates valid terms for recipient and amount', () => {
      const result = createNativeTokenPaymentTerms({
        recipient,
        amount: 10n,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000bb' +
          '000000000000000000000000000000000000000000000000000000000000000a',
      );
    });

    it('throws for invalid recipient', () => {
      expect(() =>
        createNativeTokenPaymentTerms({
          recipient: '0x1234',
          amount: 1n,
        }),
      ).toThrow('Invalid recipient: must be a valid address');
    });

    it('throws for non-positive amount', () => {
      expect(() =>
        createNativeTokenPaymentTerms({
          recipient,
          amount: 0n,
        }),
      ).toThrow('Invalid amount: must be positive');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createNativeTokenPaymentTerms(
        { recipient, amount: 5n },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(52);
    });
  });

  describe('decodeNativeTokenPaymentTerms', () => {
    const recipient =
      '0x00000000000000000000000000000000000000bb' as `0x${string}`;

    it('decodes recipient and amount', () => {
      const original = { recipient, amount: 10n };
      const decoded = decodeNativeTokenPaymentTerms(
        createNativeTokenPaymentTerms(original),
      );
      expect((decoded.recipient as string).toLowerCase()).toBe(
        recipient.toLowerCase(),
      );
      expect(decoded.amount).toBe(original.amount);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = { recipient, amount: 5n };
      const bytes = createNativeTokenPaymentTerms(original, { out: 'bytes' });
      const decoded = decodeNativeTokenPaymentTerms(bytes);
      expect((decoded.recipient as string).toLowerCase()).toBe(
        recipient.toLowerCase(),
      );
      expect(decoded.amount).toBe(5n);
    });

    it('throws when encoded terms are not exactly 52 bytes', () => {
      expect(() =>
        decodeNativeTokenPaymentTerms(`0x${'00'.repeat(51)}`),
      ).toThrow('Invalid NativeTokenPayment terms: must be exactly 52 bytes');
    });
  });
});
