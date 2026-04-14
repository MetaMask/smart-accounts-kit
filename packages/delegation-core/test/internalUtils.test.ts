import { describe, it, expect } from 'vitest';

import {
  assertHexBytesMinLength,
  assertHexByteExactLength,
  assertHexByteLengthAtLeastOneMultipleOf,
  concatHex,
  extractAddress,
  extractBigInt,
  extractHex,
  extractNumber,
  extractRemainingHex,
  getByteLength,
  normalizeAddress,
  normalizeAddressLowercase,
  normalizeHex,
  toHexString,
} from '../src/internalUtils';
import type { Hex } from '../src/types';

describe('internal utils', () => {
  describe('getByteLength', () => {
    it('returns byte count excluding 0x prefix', () => {
      expect(getByteLength('0x')).toBe(0);
      expect(getByteLength('0x00')).toBe(1);
      expect(getByteLength('0xabcd')).toBe(2);
      expect(getByteLength(`0x${'00'.repeat(32)}`)).toBe(32);
    });
  });

  describe('assertHexByteExactLength', () => {
    it('does not throw when length matches', () => {
      expect(() =>
        assertHexByteExactLength(`0x${'00'.repeat(32)}`, 32, 'err'),
      ).not.toThrow();
    });

    it('throws with the given message when length differs', () => {
      expect(() =>
        assertHexByteExactLength(`0x${'00'.repeat(31)}`, 32, 'bad len'),
      ).toThrow('bad len');
    });
  });

  describe('assertHexByteLengthAtLeastOneMultipleOf', () => {
    it('does not throw when length is a multiple', () => {
      expect(() =>
        assertHexByteLengthAtLeastOneMultipleOf(
          `0x${'00'.repeat(40)}`,
          20,
          'err',
        ),
      ).not.toThrow();
    });

    it('throws when length is not a multiple', () => {
      expect(() =>
        assertHexByteLengthAtLeastOneMultipleOf(
          `0x${'00'.repeat(19)}`,
          20,
          'bad',
        ),
      ).toThrow('bad');
    });

    it('throws when length is 0', () => {
      expect(() =>
        assertHexByteLengthAtLeastOneMultipleOf(`0x`, 20, 'bad'),
      ).toThrow('bad');
    });
  });

  describe('assertHexBytesMinLength', () => {
    it('does not throw when at or above minimum', () => {
      expect(() =>
        assertHexBytesMinLength(`0x${'00'.repeat(32)}`, 32, 'err'),
      ).not.toThrow();
      expect(() =>
        assertHexBytesMinLength(`0x${'00'.repeat(40)}`, 32, 'err'),
      ).not.toThrow();
    });

    it('throws when shorter than minimum', () => {
      expect(() =>
        assertHexBytesMinLength(`0x${'00'.repeat(31)}`, 32, 'short'),
      ).toThrow('short');
    });
  });

  describe('normalizeHex', () => {
    it('returns a valid hex string as-is', () => {
      const value = '0x1234';
      expect(normalizeHex(value, 'invalid')).toStrictEqual(value);
    });

    it('converts Uint8Array to hex', () => {
      const value = new Uint8Array([0x12, 0x34, 0xab]);
      expect(normalizeHex(value, 'invalid')).toStrictEqual('0x1234ab');
    });

    it('throws for invalid hex string', () => {
      expect(() => normalizeHex('not-hex' as any, 'invalid')).toThrow(
        'invalid',
      );
    });
  });

  describe('normalizeAddress', () => {
    it('accepts a valid address string without changing casing', () => {
      const value = '0x1234567890abcdefABCDEF1234567890abcdef12';
      expect(normalizeAddress(value, 'invalid')).toStrictEqual(value);
    });

    it('accepts a 20-byte Uint8Array address', () => {
      const value = new Uint8Array(20).fill(0x11);
      expect(normalizeAddress(value, 'invalid')).toStrictEqual(
        '0x1111111111111111111111111111111111111111',
      );
    });

    it('throws for invalid address length', () => {
      expect(() => normalizeAddress('0x1234' as any, 'invalid')).toThrow(
        'invalid',
      );
    });

    it('throws for invalid byte length', () => {
      expect(() => normalizeAddress(new Uint8Array(19), 'invalid')).toThrow(
        'invalid',
      );
    });
  });

  describe('normalizeAddressLowercase', () => {
    it('lowercases a valid address string', () => {
      const value = '0x1234567890abcdefABCDEF1234567890abcdef12';
      expect(normalizeAddressLowercase(value, 'invalid')).toStrictEqual(
        '0x1234567890abcdefabcdef1234567890abcdef12',
      );
    });

    it('accepts a 20-byte Uint8Array address', () => {
      const value = new Uint8Array(20).fill(0xaa);
      expect(normalizeAddressLowercase(value, 'invalid')).toStrictEqual(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      );
    });

    it('throws for invalid address length', () => {
      expect(() =>
        normalizeAddressLowercase('0x1234' as any, 'invalid'),
      ).toThrow('invalid');
    });
  });

  describe('concatHex', () => {
    it('concatenates hex strings with or without 0x prefix', () => {
      const result = concatHex(['0x12', '34', '0x56']);
      expect(result).toStrictEqual('0x123456');
    });

    it('returns 0x for empty parts', () => {
      expect(concatHex([])).toStrictEqual('0x');
    });
  });

  describe('toHexString', () => {
    it('pads a small number to the requested byte width', () => {
      expect(toHexString({ value: 255, size: 2 })).toBe('00ff');
      expect(toHexString({ value: 1, size: 32 })).toBe(`${'0'.repeat(62)}01`);
    });

    it('works with bigint', () => {
      expect(toHexString({ value: 16n, size: 1 })).toBe('10');
    });

    it('pads zero', () => {
      expect(toHexString({ value: 0, size: 1 })).toBe('00');
      expect(toHexString({ value: 0n, size: 32 })).toBe('0'.repeat(64));
    });

    it('fits max uint256 in 32 bytes', () => {
      const max =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      expect(toHexString({ value: max, size: 32 })).toBe(`${'f'.repeat(64)}`);
    });
  });

  describe('extractBigInt', () => {
    const value =
      '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000' as const;

    it('reads uint256 at offset 0', () => {
      expect(extractBigInt(value, 0, 32)).toBe(1000000000000000000n);
    });

    it('reads a slice at a non-zero offset', () => {
      const data =
        '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
      expect(extractBigInt(data, 0, 32)).toBe(1n);
      expect(extractBigInt(data, 32, 32)).toBe(2n);
    });

    it('treats missing digits past the string end as zero', () => {
      expect(extractBigInt('0x01', 0, 32)).toBe(1n);
    });
  });

  describe('extractNumber', () => {
    it('reads a 32-byte uint as a number', () => {
      const data =
        '0x0000000000000000000000000000000000000000000000000000000061cf9980';
      expect(extractNumber(data, 0, 32)).toBe(1640995200);
    });

    it('reads a 16-byte uint (timestamp-style)', () => {
      const data =
        '0x00000000000000000000000061cf998000000000000000000000000063b0cd00';
      expect(extractNumber(data, 0, 16)).toBe(1640995200);
      expect(extractNumber(data, 16, 16)).toBe(1672531200);
    });

    it('reads small packed values', () => {
      expect(extractNumber('0x000a', 0, 2)).toBe(10);
    });

    it('throws when extracted value exceeds MAX_SAFE_INTEGER', () => {
      const aboveMaxSafe = '0x0020000000000000' as Hex;
      expect(() => extractNumber(aboveMaxSafe, 0, 8)).toThrow(
        'Number is too large',
      );
    });
  });

  describe('extractAddress', () => {
    it('reads an address at offset 0', () => {
      const addr = '1234567890123456789012345678901234567890';
      const data = `0x${addr}0000000000000000000000000000000000000000000000000000000000000001`;
      expect(extractAddress(data, 0)).toBe(`0x${addr}`);
    });

    it('reads an address after a leading word', () => {
      const prefix = '0'.repeat(64);
      const addr = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const data = `0x${prefix}${addr}` as Hex;
      expect(extractAddress(data, 32)).toBe(`0x${addr}`);
    });
  });

  describe('extractHex', () => {
    it('reads a 4-byte selector', () => {
      const data =
        '0xa9059cbb00000000000000000000000000000000000000000000000000000000';
      expect(extractHex(data, 0, 4)).toBe('0xa9059cbb');
    });

    it('reads a slice at a non-zero offset', () => {
      const data = '0x00112233445566778899aabbccddeeff';
      expect(extractHex(data, 2, 4)).toBe('0x22334455');
      expect(extractHex(data, 8, 4)).toBe('0x8899aabb');
    });
  });

  describe('extractRemainingHex', () => {
    it('returns everything after the byte offset', () => {
      const data =
        '0x0000000000000000000000000000000000000000000000000000000000000001123456';
      expect(extractRemainingHex(data, 32)).toBe('0x123456');
    });

    it('returns 0x when offset points at the end', () => {
      expect(extractRemainingHex('0xabcd', 2)).toBe('0x');
    });
  });
});
