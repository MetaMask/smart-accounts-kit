import { describe, it, expect } from 'vitest';

import { createBlockNumberTerms } from '../../src/caveats/blockNumber';

describe('createBlockNumberTerms', () => {
  it('creates valid terms for thresholds', () => {
    const result = createBlockNumberTerms({
      afterThreshold: 5n,
      beforeThreshold: 10n,
    });

    expect(result).toStrictEqual(
      '0x000000000000000000000000000000050000000000000000000000000000000a',
    );
  });

  it('throws when afterThreshold is negative', () => {
    expect(() =>
      createBlockNumberTerms({ afterThreshold: -1n, beforeThreshold: 10n }),
    ).toThrow('Invalid thresholds: block numbers must be non-negative');
  });

  it('throws when beforeThreshold is negative', () => {
    expect(() =>
      createBlockNumberTerms({ afterThreshold: 5n, beforeThreshold: -1n }),
    ).toThrow('Invalid thresholds: block numbers must be non-negative');
  });

  it('throws when both thresholds are zero', () => {
    expect(() =>
      createBlockNumberTerms({ afterThreshold: 0n, beforeThreshold: 0n }),
    ).toThrow(
      'Invalid thresholds: At least one of afterThreshold or beforeThreshold must be specified',
    );
  });

  it('throws when afterThreshold is greater than or equal to beforeThreshold', () => {
    expect(() =>
      createBlockNumberTerms({ afterThreshold: 10n, beforeThreshold: 5n }),
    ).toThrow(
      'Invalid thresholds: afterThreshold must be less than beforeThreshold if both are specified',
    );
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createBlockNumberTerms(
      { afterThreshold: 1n, beforeThreshold: 2n },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });
});
