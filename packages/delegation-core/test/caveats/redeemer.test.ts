import { describe, it, expect } from 'vitest';

import {
  createRedeemerTerms,
  decodeRedeemerTerms,
} from '../../src/caveats/redeemer';

describe('Redeemer', () => {
  describe('createRedeemerTerms', () => {
    const redeemerA = '0x0000000000000000000000000000000000000001';
    const redeemerB = '0x0000000000000000000000000000000000000002';

    it('creates valid terms for redeemers', () => {
      const result = createRedeemerTerms({ redeemers: [redeemerA, redeemerB] });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000010000000000000000000000000000000000000002',
      );
    });

    it('throws when redeemers is undefined', () => {
      expect(() =>
        createRedeemerTerms({} as Parameters<typeof createRedeemerTerms>[0]),
      ).toThrow(
        'Invalid redeemers: must specify at least one redeemer address',
      );
    });

    it('throws for empty redeemers', () => {
      expect(() => createRedeemerTerms({ redeemers: [] })).toThrow(
        'Invalid redeemers: must specify at least one redeemer address',
      );
    });

    it('throws for invalid redeemer address', () => {
      expect(() => createRedeemerTerms({ redeemers: ['0x1234'] })).toThrow(
        'Invalid redeemers: must be a valid address',
      );
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createRedeemerTerms(
        { redeemers: [redeemerA, redeemerB] },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(40);
    });
  });

  describe('decodeRedeemerTerms', () => {
    const redeemerA =
      '0x0000000000000000000000000000000000000001' as `0x${string}`;
    const redeemerB =
      '0x0000000000000000000000000000000000000002' as `0x${string}`;

    it('decodes multiple redeemers', () => {
      const original = { redeemers: [redeemerA, redeemerB] };
      expect(decodeRedeemerTerms(createRedeemerTerms(original))).toStrictEqual(
        original,
      );
    });

    it('decodes a single redeemer', () => {
      const original = { redeemers: [redeemerA] };
      expect(decodeRedeemerTerms(createRedeemerTerms(original))).toStrictEqual(
        original,
      );
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = { redeemers: [redeemerA, redeemerB] };
      const bytes = createRedeemerTerms(original, { out: 'bytes' });
      expect(decodeRedeemerTerms(bytes)).toStrictEqual(original);
    });

    it('throws when encoded terms length is not a multiple of 20 bytes', () => {
      expect(() => decodeRedeemerTerms(`0x${'00'.repeat(19)}`)).toThrow(
        'Invalid redeemers: must be a multiple of 20',
      );
    });
  });
});
