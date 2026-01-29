import { pad, size, toHex } from 'viem';
import { expect, describe, it } from 'vitest';

import { limitedCallsBuilder } from '../../src/caveatBuilder/limitedCallsBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('limitedCallsBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 32; // 32 bytes for the limit
  const environment = {
    caveatEnforcers: { LimitedCallsEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithLimit = (limit: number) => {
    const config = { limit };
    return limitedCallsBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with non-integer limit', () => {
      expect(() => buildWithLimit(3.5)).to.throw(
        'Invalid limit: must be an integer',
      );
    });

    it('should fail with zero limit', () => {
      expect(() => buildWithLimit(0)).to.throw(
        'Invalid limit: must be a positive integer',
      );
    });

    it('should fail with negative limit', () => {
      expect(() => buildWithLimit(-1)).to.throw(
        'Invalid limit: must be a positive integer',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with a valid limit', () => {
      const limit = 5;
      const caveat = buildWithLimit(limit);
      const terms = pad(toHex(limit), { size: 32 });

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with a large valid limit', () => {
      const limit = 1000000;
      const caveat = buildWithLimit(limit);
      const terms = pad(toHex(limit), { size: 32 });

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const limit = 5;
    const caveat = buildWithLimit(limit);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
