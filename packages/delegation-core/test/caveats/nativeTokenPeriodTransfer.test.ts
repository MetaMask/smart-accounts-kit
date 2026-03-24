import { isStrictHexString } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { createNativeTokenPeriodTransferTerms, decodeNativeTokenPeriodTransferTerms } from '../../src/caveats/nativeTokenPeriodTransfer';

describe('NativeTokenPeriodTransfer', () => {
  describe('createNativeTokenPeriodTransferTerms', () => {
    const EXPECTED_BYTE_LENGTH = 96; // 32 bytes for each of the 3 parameters
    it('creates valid terms for standard parameters', () => {
      const periodAmount = 1000000000000000000n; // 1 ETH in wei
      const periodDuration = 3600; // 1 hour in seconds
      const startDate = 1640995200; // 2022-01-01 00:00:00 UTC
      const result = createNativeTokenPeriodTransferTerms({
        periodAmount,
        periodDuration,
        startDate,
      });

      expect(result).toHaveLength(194);

      const expectedPeriodAmount =
        '0000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const expectedPeriodDuration =
        '0000000000000000000000000000000000000000000000000000000000000e10';
      const expectedStartDate =
        '0000000000000000000000000000000000000000000000000000000061cf9980';
      expect(result).toStrictEqual(
        `0x${expectedPeriodAmount}${expectedPeriodDuration}${expectedStartDate}`,
      );
    });

    it('creates valid terms for small values', () => {
      const periodAmount = 1n;
      const periodDuration = 1;
      const startDate = 1;
      const result = createNativeTokenPeriodTransferTerms({
        periodAmount,
        periodDuration,
        startDate,
      });

      expect(result).toStrictEqual(
        '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for large values', () => {
      const periodAmount = 100000000000000000000n; // 100 ETH in wei
      const periodDuration = 86400; // 1 day in seconds
      const startDate = 2000000000; // Far future timestamp
      const result = createNativeTokenPeriodTransferTerms({
        periodAmount,
        periodDuration,
        startDate,
      });

      expect(result).toHaveLength(194);
      expect(isStrictHexString(result)).toBe(true);
      expect(result.length).toBe(194); // Additional length validation
    });

    it('creates valid terms for maximum safe values', () => {
      const periodAmount =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256
      const periodDuration = Number.MAX_SAFE_INTEGER;
      const startDate = Number.MAX_SAFE_INTEGER;
      const result = createNativeTokenPeriodTransferTerms({
        periodAmount,
        periodDuration,
        startDate,
      });

      expect(result).toHaveLength(194);
      expect(isStrictHexString(result)).toBe(true);
      expect(result.length).toBe(194); // Additional length validation
    });

    it('throws an error for zero period amount', () => {
      const periodAmount = 0n;
      const periodDuration = 3600;
      const startDate = 1640995200;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid periodAmount: must be a positive number');
    });

    it('throws an error for negative period amount', () => {
      const periodAmount = -1n;
      const periodDuration = 3600;
      const startDate = 1640995200;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid periodAmount: must be a positive number');
    });

    it('throws an error for zero period duration', () => {
      const periodAmount = 1000000000000000000n;
      const periodDuration = 0;
      const startDate = 1640995200;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid periodDuration: must be a positive number');
    });

    it('throws an error for negative period duration', () => {
      const periodAmount = 1000000000000000000n;
      const periodDuration = -1;
      const startDate = 1640995200;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid periodDuration: must be a positive number');
    });

    it('throws an error for zero start date', () => {
      const periodAmount = 1000000000000000000n;
      const periodDuration = 3600;
      const startDate = 0;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid startDate: must be a positive number');
    });

    it('throws an error for negative start date', () => {
      const periodAmount = 1000000000000000000n;
      const periodDuration = 3600;
      const startDate = -1;

      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount,
          periodDuration,
          startDate,
        }),
      ).toThrow('Invalid startDate: must be a positive number');
    });

    it('throws an error for undefined periodAmount', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: undefined as any,
          periodDuration: 3600,
          startDate: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null periodAmount', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: null as any,
          periodDuration: 3600,
          startDate: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined periodDuration', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: 1000000000000000000n,
          periodDuration: undefined as any,
          startDate: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null periodDuration', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: 1000000000000000000n,
          periodDuration: null as any,
          startDate: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined startDate', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: 1000000000000000000n,
          periodDuration: 3600,
          startDate: undefined as any,
        }),
      ).toThrow();
    });

    it('throws an error for null startDate', () => {
      expect(() =>
        createNativeTokenPeriodTransferTerms({
          periodAmount: 1000000000000000000n,
          periodDuration: 3600,
          startDate: null as any,
        }),
      ).toThrow();
    });

    it('handles edge case with very small period amount', () => {
      const periodAmount = 1n; // 1 wei
      const periodDuration = 1;
      const startDate = 1;
      const result = createNativeTokenPeriodTransferTerms({
        periodAmount,
        periodDuration,
        startDate,
      });

      expect(isStrictHexString(result)).toBe(true);
      expect(result).toHaveLength(194);
      expect(result.length).toBe(194); // Additional length validation
    });

    // Tests for bytes return type
    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const periodAmount = 1000000000000000000n; // 1 ETH in wei
        const periodDuration = 3600; // 1 hour in seconds
        const startDate = 1640995200; // 2022-01-01 00:00:00 UTC
        const result = createNativeTokenPeriodTransferTerms(
          {
            periodAmount,
            periodDuration,
            startDate,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });

      it('returns Uint8Array for small values with bytes encoding', () => {
        const periodAmount = 1n;
        const periodDuration = 1;
        const startDate = 1;
        const result = createNativeTokenPeriodTransferTerms(
          {
            periodAmount,
            periodDuration,
            startDate,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(96);
        // Each parameter should be 32 bytes, with the value at the end
        const expectedBytes = new Array(96).fill(0);
        expectedBytes[31] = 1; // periodAmount = 1
        expectedBytes[63] = 1; // periodDuration = 1
        expectedBytes[95] = 1; // startDate = 1
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for large values with bytes encoding', () => {
        const periodAmount = 100000000000000000000n; // 100 ETH in wei
        const periodDuration = 86400; // 1 day in seconds
        const startDate = 2000000000; // Far future timestamp
        const result = createNativeTokenPeriodTransferTerms(
          {
            periodAmount,
            periodDuration,
            startDate,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(96);
      });

      it('returns Uint8Array for maximum safe values with bytes encoding', () => {
        const periodAmount =
          115792089237316195423570985008687907853269984665640564039457584007913129639935n; // max uint256
        const periodDuration = Number.MAX_SAFE_INTEGER;
        const startDate = Number.MAX_SAFE_INTEGER;
        const result = createNativeTokenPeriodTransferTerms(
          {
            periodAmount,
            periodDuration,
            startDate,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(96);
      });
    });
  });

  describe('decodeNativeTokenPeriodTransferTerms', () => {
    it('decodes standard parameters', () => {
      const original = {
        periodAmount: 1000000000000000000n,
        periodDuration: 3600,
        startDate: 1640995200,
      };
      expect(
        decodeNativeTokenPeriodTransferTerms(
          createNativeTokenPeriodTransferTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes small values', () => {
      const original = {
        periodAmount: 1n,
        periodDuration: 1,
        startDate: 1,
      };
      expect(
        decodeNativeTokenPeriodTransferTerms(
          createNativeTokenPeriodTransferTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes maximum uint256 and max safe integers', () => {
      const original = {
        periodAmount:
          115792089237316195423570985008687907853269984665640564039457584007913129639935n,
        periodDuration: Number.MAX_SAFE_INTEGER,
        startDate: Number.MAX_SAFE_INTEGER,
      };
      expect(
        decodeNativeTokenPeriodTransferTerms(
          createNativeTokenPeriodTransferTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        periodAmount: 1000000000000000000n,
        periodDuration: 3600,
        startDate: 1640995200,
      };
      const bytes = createNativeTokenPeriodTransferTerms(original, { out: 'bytes' });
      expect(decodeNativeTokenPeriodTransferTerms(bytes)).toStrictEqual(original);
    });
  });
});
