import { describe, it, expect } from 'vitest';

import {
  createLimitedCallsTerms,
  decodeLimitedCallsTerms,
} from '../../src/caveats/limitedCalls';

describe('LimitedCalls', () => {
  describe('createLimitedCallsTerms', () => {
    it('creates valid terms for a positive limit', () => {
      const result = createLimitedCallsTerms({ limit: 5 });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000005',
      );
    });

    it('throws for non-integer limit', () => {
      expect(() => createLimitedCallsTerms({ limit: 1.5 })).toThrow(
        'Invalid limit: must be an integer',
      );
    });

    it('throws for non-positive limit', () => {
      expect(() => createLimitedCallsTerms({ limit: 0 })).toThrow(
        'Invalid limit: must be a positive integer',
      );
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createLimitedCallsTerms({ limit: 3 }, { out: 'bytes' });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(32);
    });
  });

  describe('decodeLimitedCallsTerms', () => {
    it('decodes a positive limit', () => {
      const original = { limit: 5 };
      expect(
        decodeLimitedCallsTerms(createLimitedCallsTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes a larger limit', () => {
      const original = { limit: 999_999 };
      expect(
        decodeLimitedCallsTerms(createLimitedCallsTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createLimitedCallsTerms({ limit: 3 }, { out: 'bytes' });
      expect(decodeLimitedCallsTerms(bytes)).toStrictEqual({ limit: 3 });
    });
  });
});
