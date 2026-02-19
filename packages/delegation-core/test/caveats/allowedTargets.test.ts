import { describe, it, expect } from 'vitest';

import { createAllowedTargetsTerms } from '../../src/caveats/allowedTargets';

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
