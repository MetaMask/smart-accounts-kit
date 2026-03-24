import { describe, it, expect } from 'vitest';

import { createAllowedTargetsTerms, decodeAllowedTargetsTerms } from '../../src/caveats/allowedTargets';

describe('AllowedTargets', () => {
  describe('createAllowedTargetsTerms', () => {
    const addressA = '0x0000000000000000000000000000000000000001';
    const addressB = '0x0000000000000000000000000000000000000002';

    it('creates valid terms for multiple addresses', () => {
      const result = createAllowedTargetsTerms({ targets: [addressA, addressB] });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000010000000000000000000000000000000000000002',
      );
    });

    it('throws when targets is undefined', () => {
      expect(() =>
        createAllowedTargetsTerms(
          {} as Parameters<typeof createAllowedTargetsTerms>[0],
        ),
      ).toThrow('Invalid targets: must provide at least one target address');
    });

    it('throws for empty targets array', () => {
      expect(() => createAllowedTargetsTerms({ targets: [] })).toThrow(
        'Invalid targets: must provide at least one target address',
      );
    });

    it('throws for invalid address', () => {
      expect(() =>
        createAllowedTargetsTerms({
          targets: ['0x1234'],
        }),
      ).toThrow('Invalid targets: must be valid addresses');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createAllowedTargetsTerms(
        { targets: [addressA, addressB] },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(40);
    });
  });

  describe('decodeAllowedTargetsTerms', () => {
    const addressA = '0x0000000000000000000000000000000000000001' as `0x${string}`;
    const addressB = '0x0000000000000000000000000000000000000002' as `0x${string}`;

    it('decodes multiple targets', () => {
      const original = { targets: [addressA, addressB] };
      expect(decodeAllowedTargetsTerms(createAllowedTargetsTerms(original))).toStrictEqual(
        original,
      );
    });

    it('decodes a single target', () => {
      const original = { targets: [addressA] };
      expect(decodeAllowedTargetsTerms(createAllowedTargetsTerms(original))).toStrictEqual(
        original,
      );
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = { targets: [addressA, addressB] };
      const bytes = createAllowedTargetsTerms(original, { out: 'bytes' });
      expect(decodeAllowedTargetsTerms(bytes)).toStrictEqual(original);
    });
  });
});
