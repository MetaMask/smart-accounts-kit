import { describe, it, expect } from 'vitest';

import { createAllowedMethodsTerms } from '../../src/caveats/allowedMethods';

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
