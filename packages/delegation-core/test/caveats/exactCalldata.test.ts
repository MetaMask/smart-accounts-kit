import { describe, it, expect } from 'vitest';

import { createExactCalldataTerms } from '../../src/caveats/exactCalldata';
import type { Hex } from '../../src/types';

describe('createExactCalldataTerms', () => {
  // Note: ExactCalldata terms length varies based on input calldata length
  it('creates valid terms for simple calldata', () => {
    const calldata = '0x1234567890abcdef';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual(calldata);
  });

  it('creates valid terms for empty calldata', () => {
    const calldata = '0x';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual('0x');
  });

  it('creates valid terms for function call with parameters', () => {
    // Example: transfer(address,uint256) function call
    const calldata =
      '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual(calldata);
  });

  it('creates valid terms for complex calldata', () => {
    const calldata =
      '0x23b872dd000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5f0000000000000000000000000000000000000000000000000de0b6b3a7640000';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual(calldata);
  });

  it('creates valid terms for uppercase hex calldata', () => {
    const calldata = '0x1234567890ABCDEF';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual(calldata);
  });

  it('creates valid terms for mixed case hex calldata', () => {
    const calldata = '0x1234567890AbCdEf';
    const result = createExactCalldataTerms({ calldata });

    expect(result).toStrictEqual(calldata);
  });

  it('creates valid terms for very long calldata', () => {
    const longCalldata: Hex = `0x${'a'.repeat(1000)}`;
    const result = createExactCalldataTerms({ calldata: longCalldata });

    expect(result).toStrictEqual(longCalldata);
  });

  it('throws an error for calldata without 0x prefix', () => {
    const invalidCallData = '1234567890abcdef';

    expect(() =>
      createExactCalldataTerms({ calldata: invalidCallData as Hex }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('throws an error for empty string', () => {
    const invalidCallData = '';

    expect(() =>
      createExactCalldataTerms({ calldata: invalidCallData as Hex }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('throws an error for malformed hex prefix', () => {
    const invalidCallData = '0X1234'; // uppercase X

    expect(() =>
      createExactCalldataTerms({ calldata: invalidCallData as Hex }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('throws an error for undefined callData', () => {
    expect(() =>
      createExactCalldataTerms({ calldata: undefined as any }),
    ).toThrow('Invalid calldata: calldata is required');
  });

  it('throws an error for null callData', () => {
    expect(() => createExactCalldataTerms({ calldata: null as any })).toThrow(
      'Invalid calldata: calldata is required',
    );
  });

  it('throws an error for non-string non-Uint8Array callData', () => {
    expect(() => createExactCalldataTerms({ calldata: 1234 as any })).toThrow();
  });

  it('handles single function selector', () => {
    const functionSelector = '0xa9059cbb'; // transfer(address,uint256) selector
    const result = createExactCalldataTerms({ calldata: functionSelector });

    expect(result).toStrictEqual(functionSelector);
  });

  it('handles calldata with odd length', () => {
    const oddLengthCalldata = '0x123';
    const result = createExactCalldataTerms({ calldata: oddLengthCalldata });

    expect(result).toStrictEqual(oddLengthCalldata);
  });

  // Tests for bytes return type
  describe('bytes return type', () => {
    it('returns Uint8Array when bytes encoding is specified', () => {
      const calldata = '0x1234567890abcdef';
      const result = createExactCalldataTerms({ calldata }, { out: 'bytes' });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
      ]);
    });

    it('returns Uint8Array for empty calldata with bytes encoding', () => {
      const calldata = '0x';
      const result = createExactCalldataTerms({ calldata }, { out: 'bytes' });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(0);
    });

    it('returns Uint8Array for complex calldata with bytes encoding', () => {
      const calldata =
        '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const result = createExactCalldataTerms({ calldata }, { out: 'bytes' });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(68); // 4 bytes selector + 32 bytes address + 32 bytes amount
    });
  });

  // Tests for Uint8Array input parameter
  describe('Uint8Array input parameter', () => {
    it('accepts Uint8Array as calldata parameter', () => {
      const callDataBytes = new Uint8Array([
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
      ]);
      const result = createExactCalldataTerms({ calldata: callDataBytes });

      expect(result).toStrictEqual('0x1234567890abcdef');
    });

    it('accepts empty Uint8Array as calldata parameter', () => {
      const callDataBytes = new Uint8Array([]);
      const result = createExactCalldataTerms({ calldata: callDataBytes });

      expect(result).toStrictEqual('0x');
    });

    it('accepts Uint8Array for function call with parameters', () => {
      // transfer(address,uint256) function call as bytes
      const callDataBytes = new Uint8Array([
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
      const result = createExactCalldataTerms({ calldata: callDataBytes });

      expect(result).toStrictEqual(
        '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      );
    });

    it('returns Uint8Array when input is Uint8Array and bytes encoding is specified', () => {
      const callDataBytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const result = createExactCalldataTerms(
        { calldata: callDataBytes },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([0x12, 0x34, 0x56, 0x78]);
    });
  });
});
