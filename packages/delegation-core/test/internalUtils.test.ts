import { describe, it, expect } from 'vitest';

import {
  concatHex,
  normalizeAddress,
  normalizeAddressLowercase,
  normalizeHex,
} from '../src/internalUtils';

describe('internal utils', () => {
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
});
