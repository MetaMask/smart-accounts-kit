import { concat, size, toHex } from 'viem';
import { expect, describe, it } from 'vitest';

import { blockNumberBuilder } from '../../src/caveatBuilder/blockNumberBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('blockNumberBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 32; // 16 bytes for blockAfterThreshold + 16 bytes for blockBeforeThreshold

  const environment = {
    caveatEnforcers: { BlockNumberEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithThresholds = (
    afterThreshold: bigint,
    beforeThreshold: bigint,
  ) => {
    const config = {
      afterThreshold,
      beforeThreshold,
    };
    return blockNumberBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail when both thresholds are zero', () => {
      expect(() => buildWithThresholds(0n, 0n)).to.throw(
        'Invalid thresholds: At least one of afterThreshold or beforeThreshold must be specified',
      );
    });

    it('should fail when afterThreshold is greater than or equal to beforeThreshold', () => {
      expect(() => buildWithThresholds(10n, 5n)).to.throw(
        'Invalid thresholds: afterThreshold must be less than beforeThreshold if both are specified',
      );
      expect(() => buildWithThresholds(10n, 10n)).to.throw(
        'Invalid thresholds: afterThreshold must be less than beforeThreshold if both are specified',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid thresholds', () => {
      const afterThreshold = 5n;
      const beforeThreshold = 10n;

      const caveat = buildWithThresholds(afterThreshold, beforeThreshold);

      const terms = concat([
        toHex(afterThreshold, {
          size: 16,
        }),
        toHex(beforeThreshold, {
          size: 16,
        }),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.BlockNumberEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with only afterThreshold', () => {
      const afterThreshold = 5n;
      const beforeThreshold = 0n;

      const caveat = buildWithThresholds(afterThreshold, beforeThreshold);
      const terms = concat([
        toHex(afterThreshold, {
          size: 16,
        }),
        toHex(beforeThreshold, {
          size: 16,
        }),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.BlockNumberEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with only beforeThreshold', () => {
      const afterThreshold = 0n;
      const beforeThreshold = 10n;

      const caveat = buildWithThresholds(afterThreshold, beforeThreshold);
      const terms = concat([
        toHex(afterThreshold, {
          size: 16,
        }),
        toHex(beforeThreshold, {
          size: 16,
        }),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.BlockNumberEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const afterThreshold = 5n;
    const beforeThreshold = 10n;

    const caveat = buildWithThresholds(afterThreshold, beforeThreshold);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
