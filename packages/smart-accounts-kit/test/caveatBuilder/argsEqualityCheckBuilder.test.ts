import { size, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { argsEqualityCheckBuilder } from '../../src/caveatBuilder/argsEqualityCheckBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomBytes, randomAddress } from '../utils';

describe('argsEqualityCheckBuilder()', () => {
  const environment = {
    caveatEnforcers: { ArgsEqualityCheckEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithArgs = (args: Hex) => {
    const config = { args };
    return argsEqualityCheckBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail when args is not hex', () => {
      expect(() => buildWithArgs('not-hex' as Hex)).to.throw(
        'Invalid config: args must be a valid hex string',
      );
    });

    it('should fail when args is not defined', () => {
      expect(() => buildWithArgs(undefined as any as Hex)).to.throw(
        'Invalid config: args must be a valid hex string',
      );

      expect(() => buildWithArgs(null as any as Hex)).to.throw(
        'Invalid config: args must be a valid hex string',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid args', () => {
      const args = randomBytes(128);

      const caveat = buildWithArgs(args);

      const terms = args;

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ArgsEqualityCheckEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with zero-length args', () => {
      const args = '0x';

      const caveat = buildWithArgs(args);

      const terms = args;

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ArgsEqualityCheckEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const args = randomBytes(128);

    const caveat = buildWithArgs(args);

    expect(size(caveat.terms)).to.equal(size(args));
  });
});
