import { describe, it, expect } from 'vitest';

import { createArgsEqualityCheckTerms } from '../../src/caveats/argsEqualityCheck';

describe('createArgsEqualityCheckTerms', () => {
  it('creates valid terms for args', () => {
    const args = '0x1234abcd';
    const result = createArgsEqualityCheckTerms({ args });

    expect(result).toStrictEqual(args);
  });

  it('creates valid terms for empty args', () => {
    const result = createArgsEqualityCheckTerms({ args: '0x' });

    expect(result).toStrictEqual('0x');
  });

  it('throws for invalid args', () => {
    expect(() =>
      createArgsEqualityCheckTerms({ args: 'not-hex' as any }),
    ).toThrow('Invalid config: args must be a valid hex string');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const args = '0x1234abcd';
    const result = createArgsEqualityCheckTerms({ args }, { out: 'bytes' });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(4);
  });
});
