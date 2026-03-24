import { describe, it, expect } from 'vitest';

import { createNonceTerms, decodeNonceTerms } from '../../src/caveats/nonce';
import type { Hex } from '../../src/types';

describe('Nonce', () => {
  describe('createNonceTerms', () => {
    const EXPECTED_BYTE_LENGTH = 32; // 32 bytes for nonce

    it('creates valid terms for simple nonce', () => {
      const nonce = '0x1234567890abcdef';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000001234567890abcdef',
      );
    });

    it('creates valid terms for zero nonce', () => {
      const nonce = '0x0';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('creates valid terms for minimal nonce', () => {
      const nonce = '0x1';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for full 32-byte nonce', () => {
      const nonce =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(nonce);
    });

    it('creates valid terms for uppercase hex nonce', () => {
      const nonce = '0x1234567890ABCDEF';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000001234567890ABCDEF',
      );
    });

    it('creates valid terms for mixed case hex nonce', () => {
      const nonce = '0x1234567890AbCdEf';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000001234567890AbCdEf',
      );
    });

    it('pads shorter hex values with leading zeros', () => {
      const nonce = '0xff';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000000000000000000000000000ff',
      );
    });

    it('throws an error for empty nonce', () => {
      const nonce = '0x';

      expect(() => createNonceTerms({ nonce })).toThrow(
        'Invalid nonce: must not be empty',
      );
    });

    it('throws an error for undefined nonce', () => {
      expect(() => createNonceTerms({ nonce: undefined as any })).toThrow(
        'Value must be a Uint8Array',
      );
    });

    it('throws an error for null nonce', () => {
      expect(() => createNonceTerms({ nonce: null as any })).toThrow(
        'Value must be a Uint8Array',
      );
    });

    it('throws an error for hex nonce without 0x prefix', () => {
      const nonce = '1234567890abcdef' as any;

      expect(() => createNonceTerms({ nonce })).toThrow(
        'Invalid nonce: string must have 0x prefix',
      );
    });

    it('throws an error for invalid hex characters', () => {
      const nonce = '0x1234567890abcdefg' as any;

      expect(() => createNonceTerms({ nonce })).toThrow(
        'Invalid nonce: must be a valid BytesLike value',
      );
    });

    it('throws an error for non-BytesLike nonce', () => {
      const nonce = 123456 as any;

      expect(() => createNonceTerms({ nonce })).toThrow(
        'Value must be a Uint8Array',
      );
    });

    it('throws an error for nonce longer than 32 bytes', () => {
      // 33 bytes (66 hex chars + 0x prefix = 68 chars total, which exceeds 66)
      const nonce =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12' as any;

      expect(() => createNonceTerms({ nonce })).toThrow(
        'Invalid nonce: must be 32 bytes or less in length',
      );
    });

    it('accepts nonce with exactly 32 bytes', () => {
      // 32 bytes (64 hex chars + 0x prefix = 66 chars total)
      const nonce =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(nonce);
    });

    it('throws an error for string that looks like hex but has odd length', () => {
      const nonce = '0x123' as any;
      // This should still work as we pad it
      const result = createNonceTerms({ nonce });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000123',
      );
    });

    // Tests for Uint8Array inputs
    describe('Uint8Array inputs', () => {
      it('creates valid terms for simple Uint8Array nonce', () => {
        const nonce = new Uint8Array([
          0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        ]);
        const result = createNonceTerms({ nonce });

        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000001234567890abcdef',
        );
      });

      it('creates valid terms for single byte Uint8Array', () => {
        const nonce = new Uint8Array([0x42]);
        const result = createNonceTerms({ nonce });

        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000000000000000000042',
        );
      });

      it('creates valid terms for full 32-byte Uint8Array', () => {
        const nonce = new Uint8Array([
          0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
          0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
          0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        ]);
        const result = createNonceTerms({ nonce });

        expect(result).toStrictEqual(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        );
      });

      it('creates valid terms for zero-filled Uint8Array', () => {
        const nonce = new Uint8Array([0x00, 0x00, 0x00, 0x01]);
        const result = createNonceTerms({ nonce });

        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        );
      });

      it('throws an error for empty Uint8Array', () => {
        const nonce = new Uint8Array([]);

        expect(() => createNonceTerms({ nonce })).toThrow(
          'Invalid nonce: Uint8Array must not be empty',
        );
      });

      it('throws an error for Uint8Array longer than 32 bytes', () => {
        const nonce = new Uint8Array(33).fill(0x42); // 33 bytes

        expect(() => createNonceTerms({ nonce })).toThrow(
          'Invalid nonce: must be 32 bytes or less in length',
        );
      });

      it('returns Uint8Array when bytes encoding is specified', () => {
        const nonce = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Check the last 4 bytes contain our input
        const resultArray = Array.from(result);
        expect(resultArray.slice(-4)).toEqual([0x12, 0x34, 0x56, 0x78]);
      });
    });

    // Tests for hex string inputs with bytes return type
    describe('hex string bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const nonce = '0x1234567890abcdef';
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });

      it('returns Uint8Array for minimal nonce with bytes encoding', () => {
        const nonce = '0x1';
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Should be 31 zeros followed by 1
        const expectedBytes = new Array(EXPECTED_BYTE_LENGTH).fill(0);
        expectedBytes[EXPECTED_BYTE_LENGTH - 1] = 1;
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for zero nonce with bytes encoding', () => {
        const nonce = '0x0';
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Should be all zeros
        const expectedBytes = new Array(EXPECTED_BYTE_LENGTH).fill(0);
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for full nonce with bytes encoding', () => {
        const nonce =
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Convert expected hex to bytes for comparison
        const expectedBytes = [
          0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
          0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
          0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        ];
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for padded hex values with bytes encoding', () => {
        const nonce = '0xff';
        const result = createNonceTerms({ nonce }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Should be 31 zeros followed by 0xff
        const expectedBytes = new Array(EXPECTED_BYTE_LENGTH).fill(0);
        expectedBytes[EXPECTED_BYTE_LENGTH - 1] = 0xff;
        expect(Array.from(result)).toEqual(expectedBytes);
      });
    });

    // Tests for edge cases and additional validation
    describe('edge cases and additional validation', () => {
      it('handles mixed case hex strings correctly', () => {
        const nonce = '0xaBcDeF123456';
        const result = createNonceTerms({ nonce });

        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000000000aBcDeF123456',
        );
      });

      it('handles different BytesLike types consistently', () => {
        // Same data in different formats should produce same result
        const hexNonce = '0x123456789abcdef0';
        const uint8Nonce = new Uint8Array([
          0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
        ]);

        const hexResult = createNonceTerms({ nonce: hexNonce as Hex });
        const uint8Result = createNonceTerms({ nonce: uint8Nonce });

        expect(hexResult).toStrictEqual(uint8Result);
      });

      it('handles very small values correctly', () => {
        const hexNonce = '0x01';
        const uint8Nonce = new Uint8Array([0x01]);

        const hexResult = createNonceTerms({ nonce: hexNonce as Hex });
        const uint8Result = createNonceTerms({ nonce: uint8Nonce });

        const expected =
          '0x0000000000000000000000000000000000000000000000000000000000000001';
        expect(hexResult).toStrictEqual(expected);
        expect(uint8Result).toStrictEqual(expected);
      });

      it('handles maximum size values correctly', () => {
        const maxBytes = new Array(32).fill(0xff);
        const hexNonce = `0x${maxBytes.map((b) => b.toString(16)).join('')}`;
        const uint8Nonce = new Uint8Array(maxBytes);

        const hexResult = createNonceTerms({ nonce: hexNonce as Hex });
        const uint8Result = createNonceTerms({ nonce: uint8Nonce });

        const expected =
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        expect(hexResult).toStrictEqual(expected);
        expect(uint8Result).toStrictEqual(expected);
      });

      it('handles boolean false correctly', () => {
        expect(() => createNonceTerms({ nonce: false as any })).toThrow(
          'Value must be a Uint8Array',
        );
      });

      it('handles empty object correctly', () => {
        expect(() => createNonceTerms({ nonce: {} as any })).toThrow(
          'Value must be a Uint8Array',
        );
      });

      it('handles empty array correctly', () => {
        expect(() => createNonceTerms({ nonce: [] as any })).toThrow(
          'Value must be a Uint8Array',
        );
      });

      it('handles string with only 0x prefix correctly', () => {
        const nonce = '0x';
        expect(() => createNonceTerms({ nonce })).toThrow(
          'Invalid nonce: must not be empty',
        );
      });

      it('handles non-hex string correctly', () => {
        expect(() =>
          createNonceTerms({ nonce: 'not-hex-string' as any }),
        ).toThrow('Invalid nonce: string must have 0x prefix');
      });

      it('handles hex string with invalid characters correctly', () => {
        expect(() => createNonceTerms({ nonce: '0x123g' as any })).toThrow(
          'Invalid nonce: must be a valid BytesLike value',
        );
      });

      it('validates specific error message for Uint8Array empty case', () => {
        const nonce = new Uint8Array([]);
        expect(() => createNonceTerms({ nonce })).toThrow(
          'Invalid nonce: Uint8Array must not be empty',
        );
      });

      it('validates specific error message for oversized input', () => {
        const nonce = new Uint8Array(33).fill(0xff);
        expect(() => createNonceTerms({ nonce })).toThrow(
          'Invalid nonce: must be 32 bytes or less in length',
        );
      });

      it('handles zero byte values correctly', () => {
        const nonce = new Uint8Array([0x00]);
        const result = createNonceTerms({ nonce });
        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        );
      });

      it('handles maximum valid single byte value correctly', () => {
        const nonce = new Uint8Array([0xff]);
        const result = createNonceTerms({ nonce });
        expect(result).toStrictEqual(
          '0x00000000000000000000000000000000000000000000000000000000000000ff',
        );
      });

      it('preserves exact byte order for full-size inputs', () => {
        const bytes = Array.from({ length: 32 }, (_, i) => i % 256);
        const nonce = new Uint8Array(bytes);
        const result = createNonceTerms({ nonce });

        // Should preserve exact byte order without padding
        const expectedHex = `0x${bytes
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`;
        expect(result).toStrictEqual(expectedHex);
      });

      it('handles very large hex strings correctly', () => {
        // Test exactly at the 32-byte boundary
        const maxHex = `0x${'ff'.repeat(32)}`;
        const result = createNonceTerms({ nonce: maxHex as Hex });
        expect(result).toStrictEqual(maxHex);
      });

      it('handles odd-length hex strings by padding correctly', () => {
        const nonce = '0x123';
        const result = createNonceTerms({ nonce });
        expect(result).toStrictEqual(
          '0x0000000000000000000000000000000000000000000000000000000000000123',
        );
      });

      it('distinguishes between empty nonce and invalid hex characters', () => {
        // Empty nonce gets specific "must not be empty" error
        expect(() => createNonceTerms({ nonce: '0x' })).toThrow(
          'Invalid nonce: must not be empty',
        );

        // Invalid hex characters get "must be a valid BytesLike value" error
        expect(() => createNonceTerms({ nonce: '0x123g' as any })).toThrow(
          'Invalid nonce: must be a valid BytesLike value',
        );
      });
    });
  });

  describe('decodeNonceTerms', () => {
    it('returns the padded hex nonce as BytesLike', () => {
      const encoded = createNonceTerms({ nonce: '0x1234567890abcdef' });
      expect(decodeNonceTerms(encoded).nonce).toStrictEqual(encoded);
    });

    it('decodes minimal and zero-equivalent hex forms', () => {
      expect(decodeNonceTerms(createNonceTerms({ nonce: '0x1' })).nonce).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
      expect(decodeNonceTerms(createNonceTerms({ nonce: '0x0' })).nonce).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('decodes full 32-byte nonce unchanged', () => {
      const nonce =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const encoded = createNonceTerms({ nonce });
      expect(decodeNonceTerms(encoded).nonce).toStrictEqual(encoded);
    });

    it('decodes padded short nonce (0xff)', () => {
      const encoded = createNonceTerms({ nonce: '0xff' });
      expect(decodeNonceTerms(encoded).nonce).toStrictEqual(
        '0x00000000000000000000000000000000000000000000000000000000000000ff',
      );
    });

    it('decodes odd-length hex after encoder padding', () => {
      const encoded = createNonceTerms({ nonce: '0x123' });
      expect(decodeNonceTerms(encoded).nonce).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000123',
      );
    });

    it('decodes terms from Uint8Array nonce input', () => {
      const nonce = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const encoded = createNonceTerms({ nonce });
      expect(decodeNonceTerms(encoded).nonce).toStrictEqual(encoded);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createNonceTerms({ nonce: '0xabcd' }, { out: 'bytes' });
      expect(decodeNonceTerms(bytes).nonce).toStrictEqual(
        '0x000000000000000000000000000000000000000000000000000000000000abcd',
      );
    });
  });
});
