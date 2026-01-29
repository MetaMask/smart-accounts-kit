import { size, type Address } from 'viem';
import { expect, describe, it, beforeEach } from 'vitest';

import { redeemerBuilder } from '../../src/caveatBuilder/redeemerBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('redeemerBuilder()', () => {
  const EXPECTED_TERMS_LENGTH_WITH_TWO_REDEEMERS = 40; // 20 bytes for each redeemer address

  let environment: SmartAccountsEnvironment;

  beforeEach(() => {
    environment = {
      caveatEnforcers: { RedeemerEnforcer: randomAddress() },
    } as any as SmartAccountsEnvironment;
  });

  const buildWithRedeemerAddresses = (redeemers: Address[]) => {
    const config = { redeemers };
    return redeemerBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with invalid redeemer address', () => {
      expect(() =>
        buildWithRedeemerAddresses(['0xnot-valid-address']),
      ).to.throw('Invalid redeemers: must be a valid address');
    });

    it('should fail with empty redeemer addresses', () => {
      expect(() => buildWithRedeemerAddresses([])).to.throw(
        'Invalid redeemers: must specify at least one redeemer address',
      );
    });

    it('should fail with null or undefined redeemer address', () => {
      expect(() => buildWithRedeemerAddresses([null as any])).to.throw(
        'Invalid redeemers: must be a valid address',
      );
      expect(() => buildWithRedeemerAddresses([undefined as any])).to.throw(
        'Invalid redeemers: must be a valid address',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid redeemer address', () => {
      const validAddress = randomAddress();
      const caveat = buildWithRedeemerAddresses([validAddress]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.RedeemerEnforcer,
        terms: validAddress,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const redeemers = [randomAddress(), randomAddress()];
    const caveat = buildWithRedeemerAddresses(redeemers);

    expect(size(caveat.terms)).to.equal(
      EXPECTED_TERMS_LENGTH_WITH_TWO_REDEEMERS,
    );
  });
});
