import { concat, size, toHex } from 'viem';
import { expect, describe, it } from 'vitest';

import { TIMESTAMP_UPPER_BOUND_SECONDS } from '../../src/caveatBuilder/shared';
import { timestampBuilder } from '../../src/caveatBuilder/timestampBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('timestampBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 32; // 32 bytes for the after and before thresholds
  const environment = {
    caveatEnforcers: { TimestampEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithTimestamps = (
    afterThreshold: number,
    beforeThreshold: number,
  ) => {
    const config = { afterThreshold, beforeThreshold };
    return timestampBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with negative timestamps', () => {
      expect(() => buildWithTimestamps(-1, 100)).to.throw(
        'Invalid timestampAfterThreshold: must be zero or positive',
      );
      expect(() => buildWithTimestamps(100, -100)).to.throw(
        'Invalid timestampBeforeThreshold: must be zero or positive',
      );
    });

    it('should fail when timestampBeforeThreshold is not greater than timestampAfterThreshold', () => {
      expect(() => buildWithTimestamps(100, 100)).to.throw(
        'Invalid thresholds: timestampBeforeThreshold must be greater than timestampAfterThreshold',
      );
      expect(() => buildWithTimestamps(101, 100)).to.throw(
        'Invalid thresholds: timestampBeforeThreshold must be greater than timestampAfterThreshold',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid timestamps', () => {
      const after = 1000;
      const before = 2000;
      const caveat = buildWithTimestamps(after, before);

      const afterHex = toHex(after, { size: 16 });
      const beforeHex = toHex(before, { size: 16 });
      const expectedTerms = concat([afterHex, beforeHex]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.TimestampEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with minimum and maximum possible timestamps', () => {
      const after = 0;
      const before = TIMESTAMP_UPPER_BOUND_SECONDS;
      const caveat = buildWithTimestamps(after, before);

      const afterHex = toHex(after, { size: 16 });
      const beforeHex = toHex(before, { size: 16 });
      const expectedTerms = concat([afterHex, beforeHex]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.TimestampEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const after = 1000;
    const before = 2000;
    const caveat = buildWithTimestamps(after, before);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });

  it('should fail when timestampBeforeThreshold is greater than the upper bound', () => {
    expect(() =>
      buildWithTimestamps(0, TIMESTAMP_UPPER_BOUND_SECONDS + 1),
    ).to.throw(
      'Invalid timestampBeforeThreshold: must be less than or equal to 253402300799',
    );
  });

  it('should fail when timestampAfterThreshold is greater than the upper bound', () => {
    expect(() =>
      buildWithTimestamps(TIMESTAMP_UPPER_BOUND_SECONDS + 1, 0),
    ).to.throw(
      'Invalid timestampAfterThreshold: must be less than or equal to 253402300799',
    );
  });
});
