import { describe, it, expect } from 'vitest';

import {
  createAllowedMethodsTerms,
  decodeAllowedMethodsTerms,
} from '../../src/caveats/allowedMethods';

describe('AllowedMethods', () => {
  describe('createAllowedMethodsTerms', () => {
    const selectorA = '0xa9059cbb';
    const selectorB = '0x70a08231';

    it('creates valid terms for selectors', () => {
      const result = createAllowedMethodsTerms({
        selectors: [selectorA, selectorB],
      });

      expect(result).toStrictEqual('0xa9059cbb70a08231');
    });

    it('throws when selectors is undefined', () => {
      expect(() =>
        createAllowedMethodsTerms(
          {} as Parameters<typeof createAllowedMethodsTerms>[0],
        ),
      ).toThrow('Invalid selectors: must provide at least one selector');
    });

    it('throws for empty selectors array', () => {
      expect(() => createAllowedMethodsTerms({ selectors: [] })).toThrow(
        'Invalid selectors: must provide at least one selector',
      );
    });

    it('throws for invalid selector length', () => {
      expect(() =>
        createAllowedMethodsTerms({
          selectors: ['0x123456'],
        }),
      ).toThrow(
        'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      );
    });

    it('throws for invalid selector bytes length', () => {
      expect(() =>
        createAllowedMethodsTerms({
          selectors: [new Uint8Array([0x12, 0x34, 0x56])],
        }),
      ).toThrow(
        'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      );
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createAllowedMethodsTerms(
        { selectors: [selectorA, selectorB] },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(8);
    });
  });

  describe('decodeAllowedMethodsTerms', () => {
    const selectorA = '0xa9059cbb' as `0x${string}`;
    const selectorB = '0x70a08231' as `0x${string}`;

    it('decodes multiple selectors', () => {
      const original = { selectors: [selectorA, selectorB] };
      expect(
        decodeAllowedMethodsTerms(createAllowedMethodsTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes a single selector', () => {
      const original = { selectors: [selectorA] };
      expect(
        decodeAllowedMethodsTerms(createAllowedMethodsTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createAllowedMethodsTerms(
        { selectors: [selectorA, selectorB] },
        { out: 'bytes' },
      );
      expect(decodeAllowedMethodsTerms(bytes)).toStrictEqual({
        selectors: [selectorA, selectorB],
      });
    });

    it('throws when encoded terms length is not a multiple of 4 bytes', () => {
      expect(() => decodeAllowedMethodsTerms(`0x${'00'.repeat(3)}`)).toThrow(
        'Invalid selectors: must be a multiple of 4',
      );
    });
  });
});
