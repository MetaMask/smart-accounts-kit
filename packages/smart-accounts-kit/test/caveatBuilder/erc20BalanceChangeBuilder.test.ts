import { encodePacked, size, type Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc20BalanceChangeBuilder } from '../../src/caveatBuilder/erc20BalanceChangeBuilder';
import { BalanceChangeType } from '../../src/caveatBuilder/types';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc20BalanceChangeBuilder', () => {
  const EXPECTED_TERMS_LENGTH = 73; // 1 byte for changeType + 20 bytes for token address + 20 bytes for recipient + 32 bytes for balance

  const environment = {
    caveatEnforcers: { ERC20BalanceChangeEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    token: Address,
    recipient: Address,
    balance: bigint,
    changeType: BalanceChangeType,
  ) => {
    const config = { tokenAddress: token, recipient, balance, changeType };
    return erc20BalanceChangeBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with invalid token address', () => {
      const invalidToken = '0xinvalid' as Address;
      const recipient = randomAddress();
      const balance = 100n;

      expect(() =>
        buildWithParams(
          invalidToken,
          recipient,
          balance,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid tokenAddress: must be a valid address');
    });

    it('should fail with non-positive amount', () => {
      const token = randomAddress();
      const recipient = randomAddress();
      const balance = 0n;

      expect(() =>
        buildWithParams(token, recipient, balance, BalanceChangeType.Increase),
      ).to.throw('Invalid balance: must be a positive number');
    });

    it('should fail with an invalid changeType', () => {
      const token = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;
      const invalidChangeType = 2 as BalanceChangeType;

      expect(() =>
        buildWithParams(token, recipient, balance, invalidChangeType),
      ).to.throw('Invalid changeType: must be either Increase or Decrease');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters for increase', () => {
      const token = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;

      const caveat = buildWithParams(
        token,
        recipient,
        balance,
        BalanceChangeType.Increase,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'address', 'uint256'],
        [BalanceChangeType.Increase, token, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC20BalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with valid parameters for decrease', () => {
      const token = randomAddress();
      const recipient = randomAddress();
      const balance = 1000n;

      const caveat = buildWithParams(
        token,
        recipient,
        balance,
        BalanceChangeType.Decrease,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'address', 'uint256'],
        [BalanceChangeType.Decrease, token, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC20BalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with minimum positive amount', () => {
      const token = randomAddress();
      const recipient = randomAddress();
      const balance = 1n;

      const caveat = buildWithParams(
        token,
        recipient,
        balance,
        BalanceChangeType.Increase,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'address', 'uint256'],
        [BalanceChangeType.Increase, token, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC20BalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching expected size', () => {
    const token = randomAddress();
    const recipient = randomAddress();
    const balance = 1000n;

    const caveat = buildWithParams(
      token,
      recipient,
      balance,
      BalanceChangeType.Increase,
    );

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
