import type { Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { exactCalldataBuilder } from '../../src/caveatBuilder/exactCalldataBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('exactCalldataBuilder()', () => {
  const environment = {
    caveatEnforcers: { ExactCalldataEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (calldata: Hex) => {
    const config = { calldata };
    return exactCalldataBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with invalid calldata format', () => {
      expect(() => buildWithParams('invalid' as Hex)).to.throw(
        'Invalid calldata: must be a hex string starting with 0x',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const calldata = '0x1234567890abcdef' as const;

      const caveat = buildWithParams(calldata);

      expect(caveat.enforcer).to.equal(
        environment.caveatEnforcers.ExactCalldataEnforcer,
      );
      expect(caveat.args).to.equal('0x00');
      expect(caveat.terms).to.equal(calldata);
    });
  });
});
