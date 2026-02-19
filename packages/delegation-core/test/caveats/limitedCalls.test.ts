import { describe, it, expect } from 'vitest';

import { createLimitedCallsTerms } from '../../src/caveats/limitedCalls';

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
