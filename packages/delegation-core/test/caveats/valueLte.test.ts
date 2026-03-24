import { describe, it, expect } from 'vitest';

import { createValueLteTerms, decodeValueLteTerms } from '../../src/caveats/valueLte';

describe('ValueLte', () => {
  describe('createValueLteTerms', () => {
    const EXPECTED_BYTE_LENGTH = 32; // 32 bytes for maxValue
    it('creates valid terms for positive values', () => {
      const maxValue = 1000000000000000000n; // 1 ETH in wei
      const result = createValueLteTerms({ maxValue });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      );
    });

    it('creates valid terms for zero value', () => {
      const maxValue = 0n;
      const result = createValueLteTerms({ maxValue });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('creates valid terms for a small value', () => {
      const maxValue = 1n;
      const result = createValueLteTerms({ maxValue });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for a large value', () => {
      const maxValue =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256
      const result = createValueLteTerms({ maxValue });

      expect(result).toStrictEqual(
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      );
    });

    it('pads smaller hex values with leading zeros', () => {
      const maxValue = 255n; // 0xff
      const result = createValueLteTerms({ maxValue });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000000000000000000000000000ff',
      );
    });

    it('throws an error for negative values', () => {
      const maxValue = -1n;

      expect(() => createValueLteTerms({ maxValue })).toThrow(
        'Invalid maxValue: must be greater than or equal to zero',
      );
    });

    it('throws an error for large negative values', () => {
      const maxValue = -1000000000000000000n;

      expect(() => createValueLteTerms({ maxValue })).toThrow(
        'Invalid maxValue: must be greater than or equal to zero',
      );
    });

    it('throws an error for undefined maxValue', () => {
      expect(() => createValueLteTerms({ maxValue: undefined as any })).toThrow();
    });

    it('throws an error for null maxValue', () => {
      expect(() => createValueLteTerms({ maxValue: null as any })).toThrow();
    });

    // Tests for bytes return type
    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const maxValue = 1000000000000000000n; // 1 ETH in wei
        const result = createValueLteTerms({ maxValue }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });

      it('returns Uint8Array for zero value with bytes encoding', () => {
        const maxValue = 0n;
        const result = createValueLteTerms({ maxValue }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        expect(Array.from(result)).toEqual(
          new Array(EXPECTED_BYTE_LENGTH).fill(0),
        );
      });

      it('returns Uint8Array for small value with bytes encoding', () => {
        const maxValue = 1n;
        const result = createValueLteTerms({ maxValue }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Should be 31 zeros followed by 1
        const expectedBytes = new Array(EXPECTED_BYTE_LENGTH).fill(0);
        expectedBytes[EXPECTED_BYTE_LENGTH - 1] = 1;
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for large value with bytes encoding', () => {
        const maxValue =
          115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256
        const result = createValueLteTerms({ maxValue }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        expect(Array.from(result)).toEqual(
          new Array(EXPECTED_BYTE_LENGTH).fill(0xff),
        );
      });

      it('returns Uint8Array for padded hex values with bytes encoding', () => {
        const maxValue = 255n; // 0xff
        const result = createValueLteTerms({ maxValue }, { out: 'bytes' });

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Should be 31 zeros followed by 0xff
        const expectedBytes = new Array(EXPECTED_BYTE_LENGTH).fill(0);
        expectedBytes[EXPECTED_BYTE_LENGTH - 1] = 0xff;
        expect(Array.from(result)).toEqual(expectedBytes);
      });
    });
  });

  describe('decodeValueLteTerms', () => {
    it('decodes zero maxValue', () => {
      expect(decodeValueLteTerms(createValueLteTerms({ maxValue: 0n }))).toStrictEqual({
        maxValue: 0n,
      });
    });

    it('decodes one wei', () => {
      expect(decodeValueLteTerms(createValueLteTerms({ maxValue: 1n }))).toStrictEqual({
        maxValue: 1n,
      });
    });

    it('decodes 1 ETH in wei', () => {
      const maxValue = 1000000000000000000n;
      expect(decodeValueLteTerms(createValueLteTerms({ maxValue }))).toStrictEqual({
        maxValue,
      });
    });

    it('decodes 255 padded as uint256', () => {
      expect(decodeValueLteTerms(createValueLteTerms({ maxValue: 255n }))).toStrictEqual({
        maxValue: 255n,
      });
    });

    it('decodes maximum uint256', () => {
      const maxValue =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      expect(decodeValueLteTerms(createValueLteTerms({ maxValue }))).toStrictEqual({
        maxValue,
      });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createValueLteTerms({ maxValue: 1000n }, { out: 'bytes' });
      expect(decodeValueLteTerms(bytes)).toStrictEqual({ maxValue: 1000n });
    });
  });
});
