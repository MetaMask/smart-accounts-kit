import { describe, it, expect } from 'vitest';

import {
  createNativeTokenStreamingTerms,
  decodeNativeTokenStreamingTerms,
} from '../../src/caveats/nativeTokenStreaming';

describe('NativeTokenStreaming', () => {
  describe('createNativeTokenStreamingTerms', () => {
    const EXPECTED_BYTE_LENGTH = 128; // 32 bytes for each of the 4 parameters
    it('creates valid terms for standard streaming parameters', () => {
      const initialAmount = 1000000000000000000n; // 1 ETH in wei
      const maxAmount = 10000000000000000000n; // 10 ETH in wei
      const amountPerSecond = 500000000000000000n; // 0.5 ETH per second
      const startTime = 1640995200; // 2022-01-01 00:00:00 UTC

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('creates valid terms for zero initial amount', () => {
      const initialAmount = 0n;
      const maxAmount = 5000000000000000000n; // 5 ETH in wei
      const amountPerSecond = 1000000000000000000n; // 1 ETH per second
      const startTime = 1672531200; // 2023-01-01 00:00:00 UTC

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244f400000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000063b0cd00',
      );
    });

    it('creates valid terms for equal initial and max amounts', () => {
      const initialAmount = 2000000000000000000n; // 2 ETH in wei
      const maxAmount = 2000000000000000000n; // 2 ETH in wei
      const amountPerSecond = 100000000000000000n; // 0.1 ETH per second
      const startTime = 1640995200;

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000001bc16d674ec80000000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('creates valid terms for small values', () => {
      const initialAmount = 1n;
      const maxAmount = 1000n;
      const amountPerSecond = 1n;
      const startTime = 1;

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for large values', () => {
      const initialAmount = 100000000000000000000n; // 100 ETH
      const maxAmount = 1000000000000000000000n; // 1000 ETH
      const amountPerSecond = 10000000000000000000n; // 10 ETH per second
      const startTime = 2000000000; // Far future

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000003635c9adc5dea000000000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000077359400',
      );
    });

    it('creates valid terms for maximum allowed timestamp', () => {
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 1000000000000000000n;
      const startTime = 253402300799; // January 1, 10000 CE

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000003afff4417f',
      );
    });

    it('creates valid terms for maximum safe bigint values', () => {
      const maxUint256 =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      const initialAmount = maxUint256;
      const maxAmount = maxUint256;
      const amountPerSecond = maxUint256;
      const startTime = 1640995200;

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('throws an error for negative initial amount', () => {
      const initialAmount = -1n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid initialAmount: must be greater than zero');
    });

    it('throws an error for zero max amount', () => {
      const initialAmount = 0n;
      const maxAmount = 0n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be a positive number');
    });

    it('throws an error for negative max amount', () => {
      const initialAmount = 0n;
      const maxAmount = -1n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be a positive number');
    });

    it('throws an error when max amount is less than initial amount', () => {
      const initialAmount = 1000000000000000000n; // 1 ETH
      const maxAmount = 500000000000000000n; // 0.5 ETH
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be greater than initialAmount');
    });

    it('throws an error for zero amount per second', () => {
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 0n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid amountPerSecond: must be a positive number');
    });

    it('throws an error for negative amount per second', () => {
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = -1n;
      const startTime = 1640995200;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid amountPerSecond: must be a positive number');
    });

    it('throws an error for zero start time', () => {
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 0;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid startTime: must be a positive number');
    });

    it('throws an error for negative start time', () => {
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = -1;

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid startTime: must be a positive number');
    });

    it('throws an error for start time exceeding upper bound', () => {
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 253402300800; // One second past January 1, 10000 CE

      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow(
        'Invalid startTime: must be less than or equal to 253402300799',
      );
    });

    it('throws an error for undefined initialAmount', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: undefined as any,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null initialAmount', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: null as any,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined maxAmount', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: undefined as any,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null maxAmount', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: null as any,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined amountPerSecond', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: undefined as any,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null amountPerSecond', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: null as any,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined startTime', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: undefined as any,
        }),
      ).toThrow();
    });

    it('throws an error for null startTime', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: null as any,
        }),
      ).toThrow();
    });

    it('throws an error for Infinity startTime', () => {
      expect(() =>
        createNativeTokenStreamingTerms({
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: Infinity,
        }),
      ).toThrow();
    });

    it('handles edge case with very large initial amount and small max amount difference', () => {
      const initialAmount = 999999999999999999n;
      const maxAmount = 1000000000000000000n; // Just 1 wei more
      const amountPerSecond = 1n;
      const startTime = 1640995200;

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000de0b6b3a763ffff0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('handles streaming with minimum viable parameters', () => {
      const initialAmount = 1n;
      const maxAmount = 2n;
      const amountPerSecond = 1n;
      const startTime = 1;

      const result = createNativeTokenStreamingTerms({
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    // Tests for bytes return type
    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const initialAmount = 1000000000000000000n; // 1 ETH in wei
        const maxAmount = 10000000000000000000n; // 10 ETH in wei
        const amountPerSecond = 500000000000000000n; // 0.5 ETH per second
        const startTime = 1640995200; // 2022-01-01 00:00:00 UTC
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });

      it('returns Uint8Array for zero initial amount with bytes encoding', () => {
        const initialAmount = 0n;
        const maxAmount = 5000000000000000000n; // 5 ETH in wei
        const amountPerSecond = 1000000000000000000n; // 1 ETH per second
        const startTime = 1672531200; // 2023-01-01 00:00:00 UTC
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
        // First 32 bytes should be zero (initialAmount = 0)
        const firstParam = Array.from(result.slice(0, 32));
        expect(firstParam).toEqual(new Array(32).fill(0));
      });

      it('returns Uint8Array for equal initial and max amounts with bytes encoding', () => {
        const initialAmount = 2000000000000000000n; // 2 ETH in wei
        const maxAmount = 2000000000000000000n; // 2 ETH in wei
        const amountPerSecond = 100000000000000000n; // 0.1 ETH per second
        const startTime = 1640995200;
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
      });

      it('returns Uint8Array for small values with bytes encoding', () => {
        const initialAmount = 1n;
        const maxAmount = 1000n;
        const amountPerSecond = 1n;
        const startTime = 1;
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
        // Each parameter should be 32 bytes, with the value at the end
        const expectedBytes = new Array(128).fill(0);
        expectedBytes[31] = 1; // initialAmount = 1
        expectedBytes[62] = 0x03; // maxAmount = 1000 = 0x03e8
        expectedBytes[63] = 0xe8;
        expectedBytes[95] = 1; // amountPerSecond = 1
        expectedBytes[127] = 1; // startTime = 1
        expect(Array.from(result)).toEqual(expectedBytes);
      });

      it('returns Uint8Array for large values with bytes encoding', () => {
        const initialAmount = 100000000000000000000n; // 100 ETH
        const maxAmount = 1000000000000000000000n; // 1000 ETH
        const amountPerSecond = 10000000000000000000n; // 10 ETH per second
        const startTime = 2000000000; // Far future
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
      });

      it('returns Uint8Array for maximum allowed timestamp with bytes encoding', () => {
        const initialAmount = 1000000000000000000n;
        const maxAmount = 2000000000000000000n;
        const amountPerSecond = 1000000000000000000n;
        const startTime = 253402300799; // January 1, 10000 CE
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
      });

      it('returns Uint8Array for maximum safe bigint values with bytes encoding', () => {
        const maxUint256 =
          115792089237316195423570985008687907853269984665640564039457584007913129639935n;
        const initialAmount = maxUint256;
        const maxAmount = maxUint256;
        const amountPerSecond = maxUint256;
        const startTime = 1640995200;
        const result = createNativeTokenStreamingTerms(
          {
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(128);
        // First three 32-byte chunks should be all 0xff
        expect(Array.from(result.slice(0, 32))).toEqual(
          new Array(32).fill(0xff),
        );
        expect(Array.from(result.slice(32, 64))).toEqual(
          new Array(32).fill(0xff),
        );
        expect(Array.from(result.slice(64, 96))).toEqual(
          new Array(32).fill(0xff),
        );
      });
    });
  });

  describe('decodeNativeTokenStreamingTerms', () => {
    it('decodes standard streaming parameters', () => {
      const original = {
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 500000000000000000n,
        startTime: 1640995200,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes zero initial amount', () => {
      const original = {
        initialAmount: 0n,
        maxAmount: 5000000000000000000n,
        amountPerSecond: 1000000000000000000n,
        startTime: 1672531200,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes equal initial and max amounts', () => {
      const original = {
        initialAmount: 2000000000000000000n,
        maxAmount: 2000000000000000000n,
        amountPerSecond: 100000000000000000n,
        startTime: 1640995200,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes small values', () => {
      const original = {
        initialAmount: 1n,
        maxAmount: 1000n,
        amountPerSecond: 1n,
        startTime: 1,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes maximum allowed timestamp', () => {
      const original = {
        initialAmount: 1000000000000000000n,
        maxAmount: 2000000000000000000n,
        amountPerSecond: 1000000000000000000n,
        startTime: 253402300799,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('decodes maximum uint256 amounts', () => {
      const maxUint256 =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      const original = {
        initialAmount: maxUint256,
        maxAmount: maxUint256,
        amountPerSecond: maxUint256,
        startTime: 1640995200,
      };
      expect(
        decodeNativeTokenStreamingTerms(
          createNativeTokenStreamingTerms(original),
        ),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 500000000000000000n,
        startTime: 1640995200,
      };
      const bytes = createNativeTokenStreamingTerms(original, { out: 'bytes' });
      expect(decodeNativeTokenStreamingTerms(bytes)).toStrictEqual(original);
    });
  });
});
