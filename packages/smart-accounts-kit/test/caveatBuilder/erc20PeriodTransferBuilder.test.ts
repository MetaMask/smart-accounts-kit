import { concat, size, toHex } from 'viem';
import type { Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc20PeriodTransferBuilder } from '../../src/caveatBuilder/erc20PeriodTransferBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc20PeriodTransferBuilder()', () => {
  // 20 bytes for the token address, 32 bytes for the period amount, 32 bytes for the period duration, and 32 bytes for the start date
  const EXPECTED_TERMS_LENGTH = 116;

  const environment = {
    caveatEnforcers: { ERC20PeriodTransferEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    tokenAddress: Address,
    periodAmount: bigint,
    periodDuration: number,
    startDate: number,
  ) => {
    const config = { tokenAddress, periodAmount, periodDuration, startDate };
    return erc20PeriodTransferBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid token address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(invalidAddress, 1000n, 86400, 1704067200),
      ).to.throw('Invalid tokenAddress: must be a valid address');
    });

    it('should fail with a non-positive period amount', () => {
      expect(() =>
        buildWithParams(randomAddress(), 0n, 86400, 1704067200),
      ).to.throw('Invalid periodAmount: must be a positive number');
      expect(() =>
        buildWithParams(randomAddress(), -1n, 86400, 1704067200),
      ).to.throw('Invalid periodAmount: must be a positive number');
    });

    it('should fail with a non-positive period duration', () => {
      expect(() =>
        buildWithParams(randomAddress(), 1000n, 0, 1704067200),
      ).to.throw('Invalid periodDuration: must be a positive number');
      expect(() =>
        buildWithParams(randomAddress(), 1000n, -1, 1704067200),
      ).to.throw('Invalid periodDuration: must be a positive number');
    });

    it('should fail with a non-positive start date', () => {
      expect(() => buildWithParams(randomAddress(), 1000n, 86400, 0)).to.throw(
        'Invalid startDate: must be a positive number',
      );
      expect(() => buildWithParams(randomAddress(), 1000n, 86400, -1)).to.throw(
        'Invalid startDate: must be a positive number',
      );
    });

    it('should allow valid addresses that are not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() =>
        buildWithParams(nonChecksummedAddress, 1000n, 86400, 1704067200),
      ).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const tokenAddress = randomAddress();
      const periodAmount = 1000000n;
      const periodDuration = 86400; // 1 day in seconds
      const startDate = 1704067200; // Jan 1, 2024 00:00:00 UTC

      const caveat = buildWithParams(
        tokenAddress,
        periodAmount,
        periodDuration,
        startDate,
      );

      expect(caveat.enforcer).to.equal(
        environment.caveatEnforcers.ERC20PeriodTransferEnforcer,
      );
      expect(caveat.args).to.equal('0x00');

      // Verify terms encoding
      const expectedTerms = concat([
        tokenAddress,
        toHex(periodAmount, { size: 32 }),
        toHex(periodDuration, { size: 32 }),
        toHex(startDate, { size: 32 }),
      ]);
      expect(caveat.terms).to.equal(expectedTerms);

      expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
    });
  });
});
