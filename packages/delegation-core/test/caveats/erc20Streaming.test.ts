import { describe, it, expect } from 'vitest';

import { createERC20StreamingTerms, decodeERC20StreamingTerms } from '../../src/caveats/erc20Streaming';

describe('ERC20Streaming', () => {
  describe('createERC20StreamingTerms', () => {
    const EXPECTED_BYTE_LENGTH = 148;

    const validTokenAddress = '0x1234567890123456789012345678901234567890';

    it('creates valid terms for standard streaming parameters', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 1000000000000000000n; // 1 token (18 decimals)
      const maxAmount = 10000000000000000000n; // 10 tokens
      const amountPerSecond = 500000000000000000n; // 0.5 token per second
      const startTime = 1640995200; // 2022-01-01 00:00:00 UTC

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000006f05b59d3b200000000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('creates valid terms for zero initial amount', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 5000000000000000000n; // 5 tokens
      const amountPerSecond = 1000000000000000000n; // 1 token per second
      const startTime = 1672531200; // 2023-01-01 00:00:00 UTC

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244f400000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000063b0cd00',
      );
    });

    it('creates valid terms for equal initial and max amounts', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 2000000000000000000n; // 2 tokens
      const maxAmount = 2000000000000000000n; // 2 tokens
      const amountPerSecond = 100000000000000000n; // 0.1 token per second
      const startTime = 1640995200;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000001bc16d674ec80000000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('creates valid terms for small values', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 1n;
      const maxAmount = 1000n;
      const amountPerSecond = 1n;
      const startTime = 1;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x1234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    it('creates valid terms for large values', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 100000000000000000000n; // 100 tokens
      const maxAmount = 1000000000000000000000n; // 1000 tokens
      const amountPerSecond = 10000000000000000000n; // 10 tokens per second
      const startTime = 2000000000; // Far future

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000003635c9adc5dea000000000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000077359400',
      );
    });

    it('creates valid terms for maximum allowed timestamp', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 1000000000000000000n;
      const startTime = 253402300799; // January 1, 10000 CE

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000003afff4417f',
      );
    });

    it('creates valid terms for maximum safe bigint values', () => {
      const maxUint256 =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      const tokenAddress = validTokenAddress;
      const initialAmount = maxUint256;
      const maxAmount = maxUint256;
      const amountPerSecond = maxUint256;
      const startTime = 1640995200;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x1234567890123456789012345678901234567890ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('creates valid terms for different token addresses', () => {
      const tokenAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000001bc16d674ec80000000000000000000000000000000000000000000000000000016345785d8a00000000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('throws an error for invalid token address', () => {
      const tokenAddress = 'invalid-address' as any;
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for empty token address', () => {
      const tokenAddress = '' as any;
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for token address without 0x prefix', () => {
      const tokenAddress = '1234567890123456789012345678901234567890' as any;
      const initialAmount = 1000000000000000000n;
      const maxAmount = 2000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for negative initial amount', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = -1n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid initialAmount: must be greater than zero');
    });

    it('throws an error for zero max amount', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 0n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be a positive number');
    });

    it('throws an error for negative max amount', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = -1n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be a positive number');
    });

    it('throws an error when max amount is less than initial amount', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 1000000000000000000n; // 1 token
      const maxAmount = 500000000000000000n; // 0.5 token
      const amountPerSecond = 100000000000000000n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid maxAmount: must be greater than initialAmount');
    });

    it('throws an error for zero amount per second', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 0n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid amountPerSecond: must be a positive number');
    });

    it('throws an error for negative amount per second', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = -1n;
      const startTime = 1640995200;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid amountPerSecond: must be a positive number');
    });

    it('throws an error for zero start time', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 0;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid startTime: must be a positive number');
    });

    it('throws an error for negative start time', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = -1;

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid startTime: must be a positive number');
    });

    it('throws an error for start time exceeding upper bound', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 0n;
      const maxAmount = 1000000000000000000n;
      const amountPerSecond = 100000000000000000n;
      const startTime = 253402300800; // One second past January 1, 10000 CE

      expect(() =>
        createERC20StreamingTerms({
          tokenAddress,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        }),
      ).toThrow('Invalid startTime: must be less than or equal to 253402300799');
    });

    it('throws an error for undefined tokenAddress', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: undefined as any,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for null tokenAddress', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: null as any,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws an error for undefined initialAmount', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: undefined as any,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null initialAmount', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: null as any,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined maxAmount', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: undefined as any,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null maxAmount', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: null as any,
          amountPerSecond: 100000000000000000n,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined amountPerSecond', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: undefined as any,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for null amountPerSecond', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: null as any,
          startTime: 1640995200,
        }),
      ).toThrow();
    });

    it('throws an error for undefined startTime', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: undefined as any,
        }),
      ).toThrow();
    });

    it('throws an error for null startTime', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: null as any,
        }),
      ).toThrow();
    });

    it('throws an error for Infinity startTime', () => {
      expect(() =>
        createERC20StreamingTerms({
          tokenAddress: validTokenAddress,
          initialAmount: 0n,
          maxAmount: 1000000000000000000n,
          amountPerSecond: 100000000000000000n,
          startTime: Infinity,
        }),
      ).toThrow();
    });

    it('handles edge case with very large initial amount and small max amount difference', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 999999999999999999n;
      const maxAmount = 1000000000000000000n; // Just 1 wei more
      const amountPerSecond = 1n;
      const startTime = 1640995200;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000de0b6b3a763ffff0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000061cf9980',
      );
    });

    it('handles streaming with minimum viable parameters', () => {
      const tokenAddress = validTokenAddress;
      const initialAmount = 1n;
      const maxAmount = 2n;
      const amountPerSecond = 1n;
      const startTime = 1;

      const result = createERC20StreamingTerms({
        tokenAddress,
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
      });

      expect(result).toStrictEqual(
        '0x12345678901234567890123456789012345678900000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    // Tests for bytes return type
    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 1000000000000000000n; // 1 token (18 decimals)
        const maxAmount = 10000000000000000000n; // 10 tokens
        const amountPerSecond = 500000000000000000n; // 0.5 token per second
        const startTime = 1640995200; // 2022-01-01 00:00:00 UTC
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH); // 20 bytes for token address + 32 bytes for each of the 4 parameters
      });

      it('returns Uint8Array for zero initial amount with bytes encoding', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 0n;
        const maxAmount = 5000000000000000000n; // 5 tokens
        const amountPerSecond = 1000000000000000000n; // 1 token per second
        const startTime = 1672531200; // 2023-01-01 00:00:00 UTC
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        // this is the validTokenAddress represented as bytes
        const tokenAddressBytes = [
          0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34,
          0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90,
        ];
        // initial amount is 32 0x00 bytes
        const initialAmountBytes = new Array(32).fill(0);

        // 5000000000000000000n == 0x4563918244f40000 (padded to 32 bytes)
        const maxAmountBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x45, 0x63, 0x91, 0x82, 0x44, 0xf4, 0x00, 0x00,
        ];

        // 1000000000000000000n == 0x0de0b6b3a7640000 (padded to 32 bytes)
        const amountPerSecondBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00,
        ];

        // 1672531200 == 0x63b0cd00
        const startTimeBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x63, 0xb0, 0xcd, 0x00,
        ];

        const expectedBytes = new Uint8Array([
          ...tokenAddressBytes,
          ...initialAmountBytes,
          ...maxAmountBytes,
          ...amountPerSecondBytes,
          ...startTimeBytes,
        ]);

        expect(result).toEqual(expectedBytes);
      });

      it('returns Uint8Array for equal initial and max amounts with bytes encoding', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 2000000000000000000n; // 2 tokens
        const maxAmount = 2000000000000000000n; // 2 tokens
        const amountPerSecond = 100000000000000000n; // 0.1 token per second
        const startTime = 1640995200;
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
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

      it('returns Uint8Array for small values with bytes encoding', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 1n;
        const maxAmount = 1000n;
        const amountPerSecond = 1n;
        const startTime = 1;
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // this is the validTokenAddress represented as bytes
        const tokenAddressBytes = [
          0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34,
          0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90,
        ];

        // 1n is padded to 32 bytes
        const initialAmountBytes = new Array(32).fill(0);
        initialAmountBytes[31] = 0x01;

        // 1000n == 0x03e8 (padded to 32 bytes)
        const maxAmountBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xe8,
        ];

        // 1n is padded to 32 bytes
        const amountPerSecondBytes = new Array(32).fill(0);
        amountPerSecondBytes[31] = 0x01;

        // 1 is padded to 32 bytes
        const startTimeBytes = new Array(32).fill(0);
        startTimeBytes[31] = 0x01;

        const expectedBytes = new Uint8Array([
          ...tokenAddressBytes,
          ...initialAmountBytes,
          ...maxAmountBytes,
          ...amountPerSecondBytes,
          ...startTimeBytes,
        ]);
        expect(result).toStrictEqual(expectedBytes);
      });

      it('returns Uint8Array for large values with bytes encoding', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 100000000000000000000n; // 100 tokens
        const maxAmount = 1000000000000000000000n; // 1000 tokens
        const amountPerSecond = 10000000000000000000n; // 10 tokens per second
        const startTime = 2000000000; // Far future
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
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

      it('returns Uint8Array for different token addresses with bytes encoding', () => {
        const tokenAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
        const initialAmount = 1000000000000000000n;
        const maxAmount = 2000000000000000000n;
        const amountPerSecond = 100000000000000000n;
        const startTime = 1640995200;
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Check that the token address is correctly encoded
        const addressBytes = Array.from(result.slice(0, 20));
        const expectedAddressBytes = [
          0xab, 0xcd, 0xef, 0xab, 0xcd, 0xef, 0xab, 0xcd, 0xef, 0xab, 0xcd, 0xef,
          0xab, 0xcd, 0xef, 0xab, 0xcd, 0xef, 0xab, 0xcd,
        ];
        expect(addressBytes).toEqual(expectedAddressBytes);
      });

      it('returns Uint8Array for maximum allowed timestamp with bytes encoding', () => {
        const tokenAddress = validTokenAddress;
        const initialAmount = 1000000000000000000n;
        const maxAmount = 2000000000000000000n;
        const amountPerSecond = 1000000000000000000n;
        const startTime = 253402300799; // January 1, 10000 CE
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
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

      it('returns Uint8Array for maximum safe bigint values with bytes encoding', () => {
        const maxUint256 =
          115792089237316195423570985008687907853269984665640564039457584007913129639935n;
        const tokenAddress = validTokenAddress;
        const initialAmount = maxUint256;
        const maxAmount = maxUint256;
        const amountPerSecond = maxUint256;
        const startTime = 1640995200;
        const result = createERC20StreamingTerms(
          {
            tokenAddress,
            initialAmount,
            maxAmount,
            amountPerSecond,
            startTime,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        // Token address first 20 bytes
        const addressBytes = Array.from(result.slice(0, 20));
        const expectedAddressBytes = [
          0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34,
          0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90,
        ];
        expect(addressBytes).toEqual(expectedAddressBytes);
        // Next three 32-byte chunks should be all 0xff for the bigint values
        expect(Array.from(result.slice(20, 52))).toEqual(
          new Array(32).fill(0xff),
        );
        expect(Array.from(result.slice(52, 84))).toEqual(
          new Array(32).fill(0xff),
        );
        expect(Array.from(result.slice(84, 116))).toEqual(
          new Array(32).fill(0xff),
        );
      });
    });

    // Tests for Uint8Array input parameter
    describe('Uint8Array input parameter', () => {
      it('accepts Uint8Array as tokenAddress parameter', () => {
        const tokenAddressBytes = new Uint8Array([
          0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34,
          0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90,
        ]);
        const initialAmount = 1000000000000000000n; // 1 token (18 decimals)
        const maxAmount = 10000000000000000000n; // 10 tokens
        const amountPerSecond = 500000000000000000n; // 0.5 token per second
        const startTime = 1640995200; // 2022-01-01 00:00:00 UTC

        const result = createERC20StreamingTerms({
          tokenAddress: tokenAddressBytes,
          initialAmount,
          maxAmount,
          amountPerSecond,
          startTime,
        });

        expect(result).toStrictEqual(
          '0x1234567890123456789012345678901234567890' +
            // 1000000000000000000n == 0xde0b6b3a76400000 padded to 32 bytes
            '0000000000000000000000000000000000000000000000000de0b6b3a7640000' +
            // 10000000000000000000n == 0x8ac7230489e80000 padded to 32 bytes
            '0000000000000000000000000000000000000000000000008ac7230489e80000' +
            // 500000000000000000n == 0x06f05b59d3b20000 padded to 32 bytes
            '00000000000000000000000000000000000000000000000006f05b59d3b20000' +
            // 1640995200 == 0x61cf9980
            '0000000000000000000000000000000000000000000000000000000061cf9980',
        );
      });
    });
  });

  describe('decodeERC20StreamingTerms', () => {
    const tokenAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

    it('decodes standard streaming parameters', () => {
      const original = {
        tokenAddress,
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 500000000000000000n,
        startTime: 1640995200,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes zero initial amount', () => {
      const original = {
        tokenAddress,
        initialAmount: 0n,
        maxAmount: 5000000000000000000n,
        amountPerSecond: 1000000000000000000n,
        startTime: 1672531200,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes equal initial and max amounts', () => {
      const original = {
        tokenAddress,
        initialAmount: 2000000000000000000n,
        maxAmount: 2000000000000000000n,
        amountPerSecond: 100000000000000000n,
        startTime: 1640995200,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes small values', () => {
      const original = {
        tokenAddress,
        initialAmount: 1n,
        maxAmount: 1000n,
        amountPerSecond: 1n,
        startTime: 1,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes large values', () => {
      const original = {
        tokenAddress,
        initialAmount: 100000000000000000000n,
        maxAmount: 1000000000000000000000n,
        amountPerSecond: 10000000000000000000n,
        startTime: 2000000000,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes maximum allowed timestamp', () => {
      const original = {
        tokenAddress,
        initialAmount: 1000000000000000000n,
        maxAmount: 2000000000000000000n,
        amountPerSecond: 1000000000000000000n,
        startTime: 253402300799,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes maximum uint256 amounts', () => {
      const maxUint256 =
        115792089237316195423570985008687907853269984665640564039457584007913129639935n;
      const original = {
        tokenAddress,
        initialAmount: maxUint256,
        maxAmount: maxUint256,
        amountPerSecond: maxUint256,
        startTime: 1640995200,
      };
      expect(
        decodeERC20StreamingTerms(createERC20StreamingTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenAddress,
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 500000000000000000n,
        startTime: 1640995200,
      };
      const bytes = createERC20StreamingTerms(original, { out: 'bytes' });
      expect(decodeERC20StreamingTerms(bytes)).toStrictEqual(original);
    });
  });
});
