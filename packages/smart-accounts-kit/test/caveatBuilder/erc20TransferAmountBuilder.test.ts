import { concat, size, toHex } from 'viem';
import type { Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc20TransferAmountBuilder } from '../../src/caveatBuilder/erc20TransferAmountBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc20TransferAmountBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 52; // 20 bytes for token address + 32 bytes for max amount

  const environment = {
    caveatEnforcers: { ERC20TransferAmountEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (tokenAddress: Address, maxAmount: bigint) => {
    const config = { tokenAddress, maxAmount };
    return erc20TransferAmountBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid token address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() => buildWithParams(invalidAddress, 1000n)).to.throw(
        'Invalid tokenAddress: must be a valid address',
      );
    });

    it('should fail with a non-positive max amount', () => {
      const validAddress = randomAddress();
      expect(() => buildWithParams(validAddress, 0n)).to.throw(
        'Invalid maxAmount: must be a positive number',
      );
      expect(() => buildWithParams(validAddress, -1n)).to.throw(
        'Invalid maxAmount: must be a positive number',
      );
    });

    it('should allow a valid address that is not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() =>
        buildWithParams(nonChecksummedAddress, 1000n),
      ).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const tokenAddress = randomAddress();
      const maxAmount = 1000000n;

      const caveat = buildWithParams(tokenAddress, maxAmount);
      const expectedTerms = concat([
        tokenAddress,
        toHex(maxAmount, { size: 32 }),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC20TransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should correctly handle large max amounts', () => {
      const tokenAddress = randomAddress();
      const maxAmount = 2n ** 256n - 1n; // Maximum possible value for uint256

      const caveat = buildWithParams(tokenAddress, maxAmount);
      const expectedTerms = concat([
        tokenAddress,
        toHex(maxAmount, { size: 32 }),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC20TransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const tokenAddress = randomAddress();
    const maxAmount = 1000n;

    const caveat = buildWithParams(tokenAddress, maxAmount);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
