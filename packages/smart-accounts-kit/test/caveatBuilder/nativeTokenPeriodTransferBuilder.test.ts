import { concat, size, toHex } from 'viem';
import { expect, describe, it } from 'vitest';

import { nativeTokenPeriodTransferBuilder } from '../../src/caveatBuilder/nativeTokenPeriodTransferBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('nativeTokenPeriodTransferBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 96;
  const environment = {
    caveatEnforcers: { NativeTokenPeriodTransferEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    periodAmount: bigint,
    periodDuration: number,
    startDate: number,
  ) => {
    const config = { periodAmount, periodDuration, startDate };
    return nativeTokenPeriodTransferBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with a non-positive period amount', () => {
      expect(() => buildWithParams(0n, 86400, 1704067200)).to.throw(
        'Invalid periodAmount: must be a positive number',
      );
      expect(() => buildWithParams(-1n, 86400, 1704067200)).to.throw(
        'Invalid periodAmount: must be a positive number',
      );
    });

    it('should fail with a non-positive period duration', () => {
      expect(() => buildWithParams(1000n, 0, 1704067200)).to.throw(
        'Invalid periodDuration: must be a positive number',
      );
      expect(() => buildWithParams(1000n, -1, 1704067200)).to.throw(
        'Invalid periodDuration: must be a positive number',
      );
    });

    it('should fail with a non-positive start date', () => {
      expect(() => buildWithParams(1000n, 86400, 0)).to.throw(
        'Invalid startDate: must be a positive number',
      );
      expect(() => buildWithParams(1000n, 86400, -1)).to.throw(
        'Invalid startDate: must be a positive number',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const periodAmount = 1000000000000000000n; // 1 ETH in wei
      const periodDuration = 86400; // 1 day in seconds
      const startDate = 1704067200; // Jan 1, 2024 00:00:00 UTC

      const caveat = buildWithParams(periodAmount, periodDuration, startDate);

      expect(caveat.enforcer).to.equal(
        environment.caveatEnforcers.NativeTokenPeriodTransferEnforcer,
      );
      expect(caveat.args).to.equal('0x00');

      // Verify terms encoding
      const expectedTerms = concat([
        toHex(periodAmount, { size: 32 }),
        toHex(periodDuration, { size: 32 }),
        toHex(startDate, { size: 32 }),
      ]);
      expect(caveat.terms).to.equal(expectedTerms);

      expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
    });
  });
});
