import { describe, it, expect } from 'vitest';

import { createMultiTokenPeriodTerms, decodeMultiTokenPeriodTerms } from '../../src/caveats/multiTokenPeriod';

describe('MultiTokenPeriod', () => {
  describe('createMultiTokenPeriodTerms', () => {
    const token = '0x0000000000000000000000000000000000000011';

    it('creates valid terms for a single token config', () => {
      const result = createMultiTokenPeriodTerms({
        tokenConfigs: [
          {
            token,
            periodAmount: 100n,
            periodDuration: 60,
            startDate: 10,
          },
        ],
      });

      expect(result).toStrictEqual(
        '0x0000000000000000000000000000000000000011' +
          '0000000000000000000000000000000000000000000000000000000000000064' +
          '000000000000000000000000000000000000000000000000000000000000003c' +
          '000000000000000000000000000000000000000000000000000000000000000a',
      );
    });

    it('throws for empty token configs', () => {
      expect(() => createMultiTokenPeriodTerms({ tokenConfigs: [] })).toThrow(
        'MultiTokenPeriodBuilder: tokenConfigs array cannot be empty',
      );
    });

    it('throws for invalid token address', () => {
      expect(() =>
        createMultiTokenPeriodTerms({
          tokenConfigs: [
            {
              token: '0x1234',
              periodAmount: 1n,
              periodDuration: 1,
              startDate: 1,
            },
          ],
        }),
      ).toThrow('Invalid token address: 0x1234');
    });

    it('throws for invalid period amount', () => {
      expect(() =>
        createMultiTokenPeriodTerms({
          tokenConfigs: [
            {
              token,
              periodAmount: 0n,
              periodDuration: 1,
              startDate: 1,
            },
          ],
        }),
      ).toThrow('Invalid period amount: must be greater than 0');
    });

    it('throws for invalid start date (zero)', () => {
      expect(() =>
        createMultiTokenPeriodTerms({
          tokenConfigs: [
            {
              token,
              periodAmount: 1n,
              periodDuration: 1,
              startDate: 0,
            },
          ],
        }),
      ).toThrow('Invalid start date: must be greater than 0');
    });

    it('throws for invalid start date (negative)', () => {
      expect(() =>
        createMultiTokenPeriodTerms({
          tokenConfigs: [
            {
              token,
              periodAmount: 1n,
              periodDuration: 1,
              startDate: -1,
            },
          ],
        }),
      ).toThrow('Invalid start date: must be greater than 0');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createMultiTokenPeriodTerms(
        {
          tokenConfigs: [
            {
              token,
              periodAmount: 1n,
              periodDuration: 1,
              startDate: 1,
            },
          ],
        },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(116);
    });
  });

  describe('decodeMultiTokenPeriodTerms', () => {
    const token = '0x0000000000000000000000000000000000000011' as `0x${string}`;
    const token2 = '0x0000000000000000000000000000000000000022' as `0x${string}`;

    it('decodes a single token config', () => {
      const original = {
        tokenConfigs: [
          {
            token,
            periodAmount: 100n,
            periodDuration: 60,
            startDate: 10,
          },
        ],
      };
      expect(
        decodeMultiTokenPeriodTerms(createMultiTokenPeriodTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes multiple token configs', () => {
      const original = {
        tokenConfigs: [
          {
            token,
            periodAmount: 100n,
            periodDuration: 60,
            startDate: 10,
          },
          {
            token: token2,
            periodAmount: 200n,
            periodDuration: 120,
            startDate: 20,
          },
        ],
      };
      expect(
        decodeMultiTokenPeriodTerms(createMultiTokenPeriodTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = {
        tokenConfigs: [
          {
            token,
            periodAmount: 1n,
            periodDuration: 1,
            startDate: 1,
          },
        ],
      };
      const bytes = createMultiTokenPeriodTerms(original, { out: 'bytes' });
      expect(decodeMultiTokenPeriodTerms(bytes)).toStrictEqual(original);
    });
  });
});
