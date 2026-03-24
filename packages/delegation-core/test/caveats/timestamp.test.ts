import { describe, it, expect } from 'vitest';

import { createTimestampTerms, decodeTimestampTerms } from '../../src/caveats/timestamp';

describe('Timestamp', () => {
  describe('createTimestampTerms', () => {
    const EXPECTED_BYTE_LENGTH = 32; // 16 bytes for each timestamp (2 timestamps)
    it('creates valid terms for valid timestamp range', () => {
      const timestampAfterThreshold = 1640995200; // 2022-01-01 00:00:00 UTC
      const timestampBeforeThreshold = 1672531200; // 2023-01-01 00:00:00 UTC
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000000061cf998000000000000000000000000063b0cd00',
      );
    });

    it('creates valid terms for zero thresholds', () => {
      const timestampAfterThreshold = 0;
      const timestampBeforeThreshold = 0;
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
    });

    it('creates valid terms when only after threshold is set', () => {
      const timestampAfterThreshold = 1640995200; // 2022-01-01 00:00:00 UTC
      const timestampBeforeThreshold = 0;
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000000061cf998000000000000000000000000000000000',
      );
    });

    it('creates valid terms when only before threshold is set', () => {
      const timestampAfterThreshold = 0;
      const timestampBeforeThreshold = 1672531200; // 2023-01-01 00:00:00 UTC
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000000000000000000000063b0cd00',
      );
    });

    it('creates valid terms for small timestamp values', () => {
      const timestampAfterThreshold = 1;
      const timestampBeforeThreshold = 2;
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000100000000000000000000000000000002',
      );
    });

    it('creates valid terms for maximum allowed timestamps', () => {
      const maxTimestamp = 253402300799; // January 1, 10000 CE
      const result = createTimestampTerms({
        timestampAfterThreshold: maxTimestamp,
        timestampBeforeThreshold: 0,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000003afff4417f00000000000000000000000000000000',
      );
    });

    it('throws an error for negative after threshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: -1,
          timestampBeforeThreshold: 0,
        }),
      ).toThrow('Invalid timestampAfterThreshold: must be zero or positive');
    });

    it('throws an error for negative before threshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: -1,
        }),
      ).toThrow('Invalid timestampBeforeThreshold: must be zero or positive');
    });

    it('throws an error for before threshold exceeding upper bound', () => {
      const overBound = 253402300800; // One second past January 1, 10000 CE
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: overBound,
        }),
      ).toThrow(
        'Invalid timestampBeforeThreshold: must be less than or equal to 253402300799',
      );
    });

    it('throws an error for after threshold exceeding upper bound', () => {
      const overBound = 253402300800; // One second past January 1, 10000 CE
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: overBound,
          timestampBeforeThreshold: 0,
        }),
      ).toThrow(
        'Invalid timestampAfterThreshold: must be less than or equal to 253402300799',
      );
    });

    it('throws an error when after threshold equals before threshold', () => {
      const timestamp = 1640995200;
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: timestamp,
          timestampBeforeThreshold: timestamp,
        }),
      ).toThrow(
        'Invalid thresholds: timestampBeforeThreshold must be greater than timestampAfterThreshold when both are specified',
      );
    });

    it('throws an error when after threshold is greater than before threshold', () => {
      const timestampAfterThreshold = 1672531200; // 2023-01-01 00:00:00 UTC
      const timestampBeforeThreshold = 1640995200; // 2022-01-01 00:00:00 UTC
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold,
          timestampBeforeThreshold,
        }),
      ).toThrow(
        'Invalid thresholds: timestampBeforeThreshold must be greater than timestampAfterThreshold when both are specified',
      );
    });

    it('throws an error for undefined timestampAfterThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: undefined as any,
          timestampBeforeThreshold: 0,
        }),
      ).toThrow();
    });

    it('throws an error for null timestampAfterThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: null as any,
          timestampBeforeThreshold: 0,
        }),
      ).toThrow();
    });

    it('throws an error for undefined timestampBeforeThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: undefined as any,
        }),
      ).toThrow();
    });

    it('throws an error for null timestampBeforeThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: null as any,
        }),
      ).toThrow();
    });

    it('throws an error for Infinity timestampAfterThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: Infinity,
          timestampBeforeThreshold: 0,
        }),
      ).toThrow();
    });

    it('throws an error for Infinity timestampBeforeThreshold', () => {
      expect(() =>
        createTimestampTerms({
          timestampAfterThreshold: 0,
          timestampBeforeThreshold: Infinity,
        }),
      ).toThrow();
    });

    it('allows after threshold greater than before threshold when before is 0', () => {
      const timestampAfterThreshold = 1672531200; // 2023-01-01 00:00:00 UTC
      const timestampBeforeThreshold = 0;

      // Should not throw
      const result = createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      });
      expect(result).toStrictEqual(
        '0x00000000000000000000000063b0cd0000000000000000000000000000000000',
      );
    });

    // Tests for bytes return type
    describe('bytes return type', () => {
      it('returns Uint8Array when bytes encoding is specified', () => {
        const timestampAfterThreshold = 1640995200; // 2022-01-01 00:00:00 UTC
        const timestampBeforeThreshold = 1672531200; // 2023-01-01 00:00:00 UTC
        const result = createTimestampTerms(
          {
            timestampAfterThreshold,
            timestampBeforeThreshold,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
      });

      it('returns Uint8Array for zero thresholds with bytes encoding', () => {
        const timestampAfterThreshold = 0;
        const timestampBeforeThreshold = 0;
        const result = createTimestampTerms(
          {
            timestampAfterThreshold,
            timestampBeforeThreshold,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(EXPECTED_BYTE_LENGTH);
        expect(Array.from(result)).toEqual(
          new Array(EXPECTED_BYTE_LENGTH).fill(0),
        );
      });

      it('returns Uint8Array for single timestamp with bytes encoding', () => {
        const timestampAfterThreshold = 1640995200;
        const timestampBeforeThreshold = 1672531200;
        const result = createTimestampTerms(
          {
            timestampAfterThreshold,
            timestampBeforeThreshold,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(32);

        // 1640995200 == 0x61cf9980
        const afterThresholdBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x61, 0xcf, 0x99, 0x80,
        ];
        // 1672531200 == 0x63b0cd00
        const beforeThresholdBytes = [
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x63, 0xb0, 0xcd, 0x00,
        ];
        const expectedButes = new Uint8Array([
          ...afterThresholdBytes,
          ...beforeThresholdBytes,
        ]);
        expect(result).toEqual(expectedButes);
      });

      it('returns Uint8Array for maximum allowed timestamp with bytes encoding', () => {
        const maxTimestamp = 253402300799; // January 1, 10000 CE
        const result = createTimestampTerms(
          {
            timestampAfterThreshold: maxTimestamp,
            timestampBeforeThreshold: 0,
          },
          { out: 'bytes' },
        );

        expect(result).toBeInstanceOf(Uint8Array);
        expect(result).toHaveLength(32);
      });
    });
  });

  describe('decodeTimestampTerms', () => {
    it('decodes a valid range', () => {
      const original = {
        timestampAfterThreshold: 1640995200,
        timestampBeforeThreshold: 1672531200,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('decodes both thresholds zero', () => {
      const original = {
        timestampAfterThreshold: 0,
        timestampBeforeThreshold: 0,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('decodes only after threshold set', () => {
      const original = {
        timestampAfterThreshold: 1640995200,
        timestampBeforeThreshold: 0,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('decodes only before threshold set', () => {
      const original = {
        timestampAfterThreshold: 0,
        timestampBeforeThreshold: 1672531200,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('decodes small positive timestamps', () => {
      const original = {
        timestampAfterThreshold: 1,
        timestampBeforeThreshold: 2,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('decodes maximum allowed before threshold', () => {
      const maxTimestamp = 253402300799;
      const original = {
        timestampAfterThreshold: 0,
        timestampBeforeThreshold: maxTimestamp,
      };
      expect(decodeTimestampTerms(createTimestampTerms(original))).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        timestampAfterThreshold: 1640995200,
        timestampBeforeThreshold: 1672531200,
      };
      const bytes = createTimestampTerms(original, { out: 'bytes' });
      expect(decodeTimestampTerms(bytes)).toStrictEqual(original);
    });
  });
});
