import { concat, size, type Address, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { allowedTargetsBuilder } from '../../src/caveatBuilder/allowedTargetsBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

describe('allowedTargetsBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 40; // 20 bytes per target * 2 targets

  const environment = {
    caveatEnforcers: { AllowedTargetsEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithTargets = (targets: Address[]) => {
    const config = { targets };
    return allowedTargetsBuilder(environment, config);
  };

  describe('validation', () => {
    it("should fail with targets that aren't valid addresses", () => {
      const targets: Address[] = ['invalid-address' as Address];

      expect(() => buildWithTargets(targets)).to.throw(
        'Invalid targets: must be valid addresses',
      );
    });

    it("should fail with targets that aren't correct length", () => {
      const targets: Hex[] = [randomBytes(2), randomBytes(41)];

      expect(() => buildWithTargets(targets)).to.throw(
        'Invalid targets: must be valid addresses',
      );
    });

    it("should allow valid address, that's not checksummed", () => {
      // we uppercase here, because lowercase is considered valid by `isAddress`
      const nonChecksummedAddress: Address = `0x${randomAddress()
        .slice(2)
        .toUpperCase()}`;
      const targets: Hex[] = [nonChecksummedAddress];

      expect(() => buildWithTargets(targets)).to.not.throw();
    });

    it('should report all invalid addresses in the error message', () => {
      const targets: Address[] = [randomBytes(2), 'invalid-address' as Address];

      expect(() => buildWithTargets(targets)).to.throw(
        'Invalid targets: must be valid addresses',
      );
    });

    it('should fail invalid selectors interspersed with valid addresses', () => {
      const targets: Hex[] = [
        randomAddress(),
        '0x12',
        randomAddress(),
        'invalid-address' as Hex,
        randomAddress(),
      ];

      expect(() => buildWithTargets(targets)).to.throw(
        'Invalid targets: must be valid addresses',
      );
    });

    it('should fail with no target selectors', () => {
      const targets: Address[] = [];

      expect(() => buildWithTargets(targets)).to.throw(
        'Invalid targets: must provide at least one target address',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with a valid address', () => {
      const targets = [randomAddress()];

      const caveat = buildWithTargets(targets);
      const terms = concat(targets);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with a number of valid addresses', () => {
      const targets = Array.from({ length: 8 }, () => randomAddress());

      const caveat = buildWithTargets(targets);
      const terms = concat(targets);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const targets = [randomAddress(), randomAddress()];

    const caveat = buildWithTargets(targets);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
