import { describe, it, expect } from 'vitest';

import {
  createArgsEqualityCheckTerms,
  decodeArgsEqualityCheckTerms,
} from '../../src/caveats/argsEqualityCheck';

describe('ArgsEqualityCheck', () => {
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

  describe('decodeArgsEqualityCheckTerms', () => {
    it('decodes arbitrary args hex', () => {
      const args = '0x1234abcd' as `0x${string}`;
      expect(
        decodeArgsEqualityCheckTerms(createArgsEqualityCheckTerms({ args })),
      ).toStrictEqual({
        args,
      });
    });

    it('decodes empty args', () => {
      expect(
        decodeArgsEqualityCheckTerms(
          createArgsEqualityCheckTerms({ args: '0x' }),
        ),
      ).toStrictEqual({ args: '0x' });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const args = '0xdeadbeef' as `0x${string}`;
      const bytes = createArgsEqualityCheckTerms({ args }, { out: 'bytes' });
      expect(decodeArgsEqualityCheckTerms(bytes)).toStrictEqual({ args });
    });
  });
});
