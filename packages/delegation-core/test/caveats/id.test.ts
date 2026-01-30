import { describe, it, expect } from 'vitest';

import { createIdTerms } from '../../src/caveats/id';

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
