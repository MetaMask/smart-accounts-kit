import { size, toHex } from 'viem';
import { expect, describe, it } from 'vitest';

import { nativeTokenTransferAmountBuilder } from '../../src/caveatBuilder/nativeTokenTransferAmountBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('nativeTokenTransferAmountBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 32; // 32 bytes for the allowance

  const environment = {
    caveatEnforcers: { NativeTokenTransferAmountEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithAllowance = (maxAmount: bigint) => {
    const config = { maxAmount };
    return nativeTokenTransferAmountBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with negative allowance', () => {
      expect(() => buildWithAllowance(-1n)).to.throw(
        'Invalid maxAmount: must be zero or positive',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid allowance', () => {
      const allowance = 1000000000000000000n; // 1 ETH in wei
      const caveat = buildWithAllowance(allowance);

      const expectedTerms = toHex(allowance, { size: 32 });

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with zero allowance', () => {
      const allowance = 0n;
      const caveat = buildWithAllowance(allowance);

      const expectedTerms = toHex(allowance, { size: 32 });

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with maximum possible allowance', () => {
      const allowance = 2n ** 256n - 1n; // Maximum value for uint256
      const caveat = buildWithAllowance(allowance);

      const expectedTerms = toHex(allowance, { size: 32 });

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const allowance = 1000000000000000000n; // 1 ETH in wei
    const caveat = buildWithAllowance(allowance);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
