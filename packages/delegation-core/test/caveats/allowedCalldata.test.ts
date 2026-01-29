import { hexToBytes } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { createAllowedCalldataTerms } from '../../src/caveats/allowedCalldata';
import { toHexString } from '../../src/internalUtils';
import type { Hex } from '../../src/types';

describe('createAllowedCalldataTerms', function () {
  const prefixWithIndex = (startIndex: number, value: Hex): Hex => {
    const indexHex = toHexString({ value: startIndex, size: 32 });
    return `0x${indexHex}${value.slice(2)}` as Hex;
  };

  // Note: AllowedCalldata terms length varies based on input calldata length + 32-byte index prefix
  it('creates valid terms for simple value', () => {
    const value = '0x1234567890abcdef';
    const startIndex = 0;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for empty value', () => {
    const value = '0x';
    const startIndex = 5;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for function call with parameters', () => {
    // Example: transfer(address,uint256) function call
    const value =
      '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000';
    const startIndex = 12;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for complex value', () => {
    const value =
      '0x23b872dd000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5f0000000000000000000000000000000000000000000000000de0b6b3a7640000';
    const startIndex = 4;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for uppercase hex value', () => {
    const value = '0x1234567890ABCDEF';
    const startIndex = 0;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for mixed case hex value', () => {
    const value = '0x1234567890AbCdEf';
    const startIndex = 1;
    const result = createAllowedCalldataTerms({ startIndex, value });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, value));
  });

  it('creates valid terms for very long value', () => {
    const longValue: Hex = `0x${'a'.repeat(1000)}`;
    const startIndex = 31;
    const result = createAllowedCalldataTerms({
      startIndex,
      value: longValue,
    });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, longValue));
  });

  it('throws an error for value without 0x prefix', () => {
    const invalidValue = '1234567890abcdef' as Hex;
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: invalidValue,
      }),
    ).toThrow('Invalid value: must be a hex string starting with 0x');
  });

  it('throws an error for empty string', () => {
    const invalidValue = '' as Hex;
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: invalidValue,
      }),
    ).toThrow('Invalid value: must be a hex string starting with 0x');
  });

  it('throws an error for malformed hex prefix', () => {
    const invalidValue = '0X1234' as Hex; // uppercase X
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: invalidValue,
      }),
    ).toThrow('Invalid value: must be a hex string starting with 0x');
  });

  it('throws an error for undefined value', () => {
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: undefined as unknown as Hex,
      }),
    ).toThrow();
  });

  it('throws an error for null value', () => {
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: null as unknown as Hex,
      }),
    ).toThrow();
  });

  it('throws an error for non-string non-Uint8Array value', () => {
    expect(() =>
      createAllowedCalldataTerms({
        startIndex: 0,
        value: 1234 as unknown as Hex,
      }),
    ).toThrow();
  });

  it('handles single function selector', () => {
    const functionSelector = '0xa9059cbb'; // transfer(address,uint256) selector
    const startIndex = 7;
    const result = createAllowedCalldataTerms({
      startIndex,
      value: functionSelector,
    });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, functionSelector));
  });

  it('handles calldata with odd length', () => {
    const oddLengthValue = '0x123';
    const startIndex = 0;
    const result = createAllowedCalldataTerms({
      startIndex,
      value: oddLengthValue,
    });
    expect(result).toStrictEqual(prefixWithIndex(startIndex, oddLengthValue));
  });

  // Tests for bytes return type
  describe('bytes return type', () => {
    it('returns Uint8Array when bytes encoding is specified', () => {
      const value = '0x1234567890abcdef';
      const startIndex = 2;
      const result = createAllowedCalldataTerms(
        { startIndex, value },
        { out: 'bytes' },
      );
      // Expect: 32 bytes index + 8 bytes value = 40 bytes
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(32 + 8);
      // Verify prefix bytes equal encoded index
      const expectedPrefixHex = toHexString({ value: startIndex, size: 32 });
      const expectedPrefix = Array.from(hexToBytes(expectedPrefixHex));
      expect(Array.from(result.slice(0, 32))).toEqual(expectedPrefix);
      // Verify value bytes at the end
      expect(Array.from(result.slice(32))).toEqual([
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
      ]);
    });

    it('returns Uint8Array for empty value with bytes encoding', () => {
      const value = '0x';
      const startIndex = 0;
      const result = createAllowedCalldataTerms(
        { startIndex, value },
        { out: 'bytes' },
      );
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(32); // just the index prefix
    });

    it('returns Uint8Array for complex value with bytes encoding', () => {
      const value =
        '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const startIndex = 15;
      const result = createAllowedCalldataTerms(
        { startIndex, value },
        { out: 'bytes' },
      );
      expect(result).toBeInstanceOf(Uint8Array);
      // 32 prefix + 68 bytes calldata
      expect(result).toHaveLength(32 + 68);
    });
  });

  describe('startIndex validation', () => {
    it('throws for negative integer startIndex', () => {
      const value = '0x1234';
      expect(() =>
        createAllowedCalldataTerms({ startIndex: -1, value }),
      ).toThrow('Invalid startIndex: must be zero or positive');
    });

    it('throws for negative fractional startIndex', () => {
      const value = '0x1234';
      expect(() =>
        createAllowedCalldataTerms({ startIndex: -0.1, value }),
      ).toThrow('Invalid startIndex: must be zero or positive');
    });

    it('throws for non-integer positive startIndex', () => {
      const value = '0x1234';
      expect(() =>
        createAllowedCalldataTerms({ startIndex: 1.5, value }),
      ).toThrow('Invalid startIndex: must be a whole number');
    });

    it('throws for NaN startIndex', () => {
      const value = '0x1234';
      expect(() =>
        createAllowedCalldataTerms({ startIndex: Number.NaN, value }),
      ).toThrow('Invalid startIndex: must be a whole number');
    });

    it('throws for Infinity startIndex', () => {
      const value = '0x1234';
      expect(() =>
        createAllowedCalldataTerms({ startIndex: Infinity, value }),
      ).toThrow('Invalid startIndex: must be a whole number');
    });

    it('accepts zero startIndex', () => {
      const value = '0xdeadbeef';
      const result = createAllowedCalldataTerms({ startIndex: 0, value });
      expect(result).toStrictEqual(prefixWithIndex(0, value));
    });

    it('accepts large integer startIndex and encodes correctly', () => {
      const value = '0x00';
      const large = Number.MAX_SAFE_INTEGER; // 2^53 - 1
      const result = createAllowedCalldataTerms({
        startIndex: large,
        value,
      });
      const expected = prefixWithIndex(large, value);
      expect(result).toStrictEqual(expected);
      // Check length: 32-byte prefix + 1-byte calldata = 33 bytes hex (66 chars) + '0x'
      expect(result.length).toBe(2 + 64 + 2);
    });
  });

  // Tests for Uint8Array input parameter
  describe('Uint8Array input parameter', () => {
    it('accepts Uint8Array as value parameter', () => {
      const valueBytes = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
      ]);
      const startIndex = 3;
      const result = createAllowedCalldataTerms({
        startIndex,
        value: valueBytes,
      });
      expect(result).toStrictEqual(
        prefixWithIndex(startIndex, '0x1234567890abcdef'),
      );
    });

    it('accepts empty Uint8Array as value parameter', () => {
      const callDataBytes = new Uint8Array([]);
      const startIndex = 0;
      const result = createAllowedCalldataTerms({
        startIndex,
        value: callDataBytes,
      });
      expect(result).toStrictEqual(prefixWithIndex(startIndex, '0x'));
    });

    it('accepts Uint8Array for function call with parameters', () => {
      // transfer(address,uint256) function call as bytes
      const valueBytes = new Uint8Array([
        0xa9,
        0x05,
        0x9c,
        0xbb, // transfer selector
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // padding
        0x74,
        0x2d,
        0x35,
        0xcc,
        0x66,
        0x34,
        0xc0,
        0x53,
        0x29,
        0x25,
        0xa3,
        0xb8,
        0xd4,
        0x0e,
        0xc4,
        0x9b,
        0x0e,
        0x8b,
        0xaa,
        0x5e, // address
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x0d,
        0xe0,
        0xb6,
        0xb3,
        0xa7,
        0x64,
        0x00,
        0x00, // amount
      ]);
      const startIndex = 8;
      const result = createAllowedCalldataTerms({
        startIndex,
        value: valueBytes,
      });
      expect(result).toStrictEqual(
        prefixWithIndex(
          startIndex,
          '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ),
      );
    });

    it('returns Uint8Array when input is Uint8Array and bytes encoding is specified', () => {
      const valueBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const startIndex = 0;
      const result = createAllowedCalldataTerms(
        { startIndex, value: valueBytes },
        { out: 'bytes' },
      );
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([
        // 32-byte index (all zeros)
        ...new Array(32).fill(0x00),
        // calldata
        0x12,
        0x34,
        0x56,
        0x78,
      ]);
    });
  });
});
