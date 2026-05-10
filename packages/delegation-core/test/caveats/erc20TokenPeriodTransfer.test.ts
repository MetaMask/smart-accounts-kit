import { isStrictHexString } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import {
  createERC20TokenPeriodTransferTerms,
  decodeERC20TokenPeriodTransferTerms,
} from '../../src/caveats/erc20TokenPeriodTransfer';

describe('ERC20TokenPeriodTransfer', () => {
  describe('createERC20TokenPeriodTransferTerms', () => {
    const tokenAddress = '0x0000000000000000000000000000000000000011';
    const EXPECTED_BYTE_LENGTH = 116; // 20-byte address + 3 x 32-byte values

    it('creates valid terms for standard parameters', () => {
      const periodAmount = 1000000000000000000n; // 1 token at 18 decimals
      const periodDuration = 3600; // 1 hour in seconds
      const startDate = 1640995200; // 2022-01-01 00:00:00 UTC
      const result = createERC20TokenPeriodTransferTerms({
        tokenAddress,
        periodAmount,
        periodDuration,
        startDate,
      });

      const expectedPeriodAmount =
        '0000000000000000000000000000000000000000000000000de0b6b3a7640000';
      const expectedPeriodDuration =
        '0000000000000000000000000000000000000000000000000000000000000e10';
      const expectedStartDate =
        '0000000000000000000000000000000000000000000000000000000061cf9980';

      expect(result).toStrictEqual(
        `${tokenAddress}${expectedPeriodAmount}${expectedPeriodDuration}${expectedStartDate}`,
      );
      expect(result).toHaveLength(234);
    });

    it('creates valid terms when periodDuration is bigint', () => {
      const result = createERC20TokenPeriodTransferTerms({
        tokenAddress,
        periodAmount: 1n,
        periodDuration: 1n,
        startDate: 1,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000011' +
          '0000000000000000000000000000000000000000000000000000000000000001' +
          '0000000000000000000000000000000000000000000000000000000000000001' +
          '0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms when tokenAddress is bytes', () => {
      const tokenAddressBytes = Uint8Array.from([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17,
      ]);
      const result = createERC20TokenPeriodTransferTerms({
        tokenAddress: tokenAddressBytes,
        periodAmount: 10n,
        periodDuration: 60,
        startDate: 10,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000011' +
          '000000000000000000000000000000000000000000000000000000000000000a' +
          '000000000000000000000000000000000000000000000000000000000000003c' +
          '000000000000000000000000000000000000000000000000000000000000000a',
      );
    });

    it('throws an error for invalid token address', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress: '0x1234',
          periodAmount: 1n,
          periodDuration: 1,
          startDate: 1,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for invalid token address bytes length', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress: new Uint8Array(19),
          periodAmount: 1n,
          periodDuration: 1,
          startDate: 1,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for zero period amount', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress,
          periodAmount: 0n,
          periodDuration: 3600,
          startDate: 1640995200,
        }),
      ).toThrow('Invalid periodAmount: must be a positive number');
    });

    it('throws an error for zero period duration', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress,
          periodAmount: 1000000000000000000n,
          periodDuration: 0,
          startDate: 1640995200,
        }),
      ).toThrow('Invalid periodDuration: must be a positive number');
    });

    it('throws an error for negative period duration bigint', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress,
          periodAmount: 1000000000000000000n,
          periodDuration: -1n,
          startDate: 1640995200,
        }),
      ).toThrow('Invalid periodDuration: must be a positive number');
    });

    it('throws an error for zero start date', () => {
      expect(() =>
        createERC20TokenPeriodTransferTerms({
          tokenAddress,
          periodAmount: 1000000000000000000n,
          periodDuration: 3600,
          startDate: 0,
        }),
      ).toThrow('Invalid startDate: must be a positive number');
    });

    it('creates valid terms for maximum safe values', () => {
      const result = createERC20TokenPeriodTransferTerms({
        tokenAddress,
        periodAmount:
          115792089237316195423570985008687907853269984665640564039457584007913129639935n, // max uint256
        periodDuration: Number.MAX_SAFE_INTEGER,
        startDate: Number.MAX_SAFE_INTEGER,
      });

      expect(result).toHaveLength(234);
      expect(isStrictHexString(result)).toBe(true);
    });

    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const result = createERC20TokenPeriodTransferTerms(
          {
            tokenAddress,
            periodAmount: 1000000000000000000n,
            periodDuration: 3600,
            startDate: 1640995200,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });
    });
  });

  describe('decodeERC20TokenPeriodTransferTerms', () => {
    const tokenAddress =
      '0x0000000000000000000000000000000000000011' as `0x${string}`;

    it('decodes standard parameters', () => {
      const original = {
        tokenAddress,
        periodAmount: 1000000000000000000n,
        periodDuration: 3600,
        startDate: 1640995200,
      };

      expect(
        decodeERC20TokenPeriodTransferTerms(
          createERC20TokenPeriodTransferTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes bigint periodDuration input as number', () => {
      const original = {
        tokenAddress,
        periodAmount: 1n,
        periodDuration: 1n,
        startDate: 1,
      };

      expect(
        decodeERC20TokenPeriodTransferTerms(
          createERC20TokenPeriodTransferTerms(original),
        ),
      ).toStrictEqual({
        tokenAddress,
        periodAmount: 1n,
        periodDuration: 1,
        startDate: 1,
      });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenAddress,
        periodAmount: 1n,
        periodDuration: 1,
        startDate: 1,
      };
      const bytes = createERC20TokenPeriodTransferTerms(original, {
        out: 'bytes',
      });

      expect(decodeERC20TokenPeriodTransferTerms(bytes)).toStrictEqual(
        original,
      );
    });

    it('decodes tokenAddress as Uint8Array when bytes output is requested', () => {
      const original = {
        tokenAddress,
        periodAmount: 1n,
        periodDuration: 1,
        startDate: 1,
      };
      const decoded = decodeERC20TokenPeriodTransferTerms(
        createERC20TokenPeriodTransferTerms(original),
        { out: 'bytes' },
      );

      expect(decoded.tokenAddress).toBeInstanceOf(Uint8Array);
      expect(Array.from(decoded.tokenAddress)).toStrictEqual([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17,
      ]);
      expect(decoded.periodAmount).toBe(1n);
      expect(decoded.periodDuration).toBe(1);
      expect(decoded.startDate).toBe(1);
    });

    it('throws when encoded terms are not exactly 116 bytes', () => {
      expect(() =>
        decodeERC20TokenPeriodTransferTerms(`0x${'00'.repeat(115)}`),
      ).toThrow(
        'Invalid ERC20TokenPeriodTransfer terms: must be exactly 116 bytes',
      );
    });
  });
});
