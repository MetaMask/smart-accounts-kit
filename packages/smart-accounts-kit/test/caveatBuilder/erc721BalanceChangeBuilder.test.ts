import { encodePacked } from 'viem';
import type { Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc721BalanceChangeBuilder } from '../../src/caveatBuilder/erc721BalanceChangeBuilder';
import { BalanceChangeType } from '../../src/caveatBuilder/types';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc721BalanceChangeBuilder()', () => {
  const environment = {
    caveatEnforcers: { ERC721BalanceChangeEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    tokenAddress: Address,
    recipient: Address,
    amount: bigint,
    changeType: BalanceChangeType,
  ) => {
    const config = { tokenAddress, recipient, amount, changeType };
    return erc721BalanceChangeBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid token address', () => {
      const invalidAddress = 'invalid-address' as Address;
      const recipient = randomAddress();
      const balance = 1n;
      const changeType = BalanceChangeType.Increase;

      expect(() =>
        buildWithParams(invalidAddress, recipient, balance, changeType),
      ).to.throw('Invalid tokenAddress: must be a valid address');
    });

    it('should fail with a non-positive balance', () => {
      const validAddress = randomAddress();
      const recipient = randomAddress();
      const balance = 0n;
      const changeType = BalanceChangeType.Increase;

      expect(() =>
        buildWithParams(validAddress, recipient, balance, changeType),
      ).to.throw('Invalid balance: must be a positive number');
      expect(() =>
        buildWithParams(validAddress, recipient, -1n, changeType),
      ).to.throw('Invalid balance: must be a positive number');
    });

    it('should allow a valid address that is not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      const recipient = randomAddress();
      const balance = 1000n;
      const changeType = BalanceChangeType.Increase;

      expect(() =>
        buildWithParams(nonChecksummedAddress, recipient, balance, changeType),
      ).to.not.throw();
    });

    it('should fail with an invalid changeType', () => {
      const validAddress = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;
      const invalidChangeType = 2 as BalanceChangeType;

      expect(() =>
        buildWithParams(validAddress, recipient, balance, invalidChangeType),
      ).to.throw('Invalid changeType: must be either Increase or Decrease');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters for increase', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;
      const changeType = BalanceChangeType.Increase;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        balance,
        changeType,
      );
      const expectedTerms = encodePacked(
        ['uint8', 'address', 'address', 'uint256'],
        [changeType, tokenAddress, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC721BalanceChangeEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with valid parameters for decrease', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;
      const changeType = BalanceChangeType.Decrease;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        balance,
        changeType,
      );
      const expectedTerms = encodePacked(
        ['uint8', 'address', 'address', 'uint256'],
        [changeType, tokenAddress, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC721BalanceChangeEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });
});
