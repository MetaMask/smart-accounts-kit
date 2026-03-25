import { describe, it, expect } from 'vitest';

import { createIdTerms, decodeIdTerms } from '../../src/caveats/id';

describe('Id', () => {
  describe('createIdTerms', () => {
    it('creates valid terms for number id', () => {
      const result = createIdTerms({ id: 1 });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for bigint id', () => {
      const result = createIdTerms({ id: 255n });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000000000000000000000000000ff',
      );
    });

    it('throws for non-integer number', () => {
      expect(() => createIdTerms({ id: 1.5 })).toThrow(
        'Invalid id: must be an integer',
      );
    });

    it('throws for negative id', () => {
      expect(() => createIdTerms({ id: -1 })).toThrow(
        'Invalid id: must be a non-negative number',
      );
    });

    it('throws for invalid id type', () => {
      expect(() => createIdTerms({ id: '1' as any })).toThrow(
        'Invalid id: must be a bigint or number',
      );
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createIdTerms({ id: 2 }, { out: 'bytes' });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(32);
    });
  });

  describe('decodeIdTerms', () => {
    it('decodes zero id', () => {
      expect(decodeIdTerms(createIdTerms({ id: 0n }))).toStrictEqual({
        id: 0n,
      });
    });

    it('decodes bigint id matching encoder output', () => {
      const original = { id: 255n };
      expect(decodeIdTerms(createIdTerms(original))).toStrictEqual(original);
    });

    it('decodes terms produced from a number id as bigint', () => {
      expect(decodeIdTerms(createIdTerms({ id: 1 }))).toStrictEqual({
        id: 1n,
      });
    });

    it('decodes maximum uint256', () => {
      const max =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      expect(decodeIdTerms(createIdTerms({ id: max }))).toStrictEqual({
        id: max,
      });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createIdTerms({ id: 42n }, { out: 'bytes' });
      expect(decodeIdTerms(bytes)).toStrictEqual({ id: 42n });
    });

    it('throws when encoded terms are not exactly 32 bytes', () => {
      expect(() => decodeIdTerms(`0x${'00'.repeat(31)}`)).toThrow(
        'Invalid Id terms: must be exactly 32 bytes',
      );
    });
  });
});
