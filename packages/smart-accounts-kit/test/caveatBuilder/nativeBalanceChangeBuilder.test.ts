import { encodePacked, size, type Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { nativeBalanceChangeBuilder } from '../../src/caveatBuilder/nativeBalanceChangeBuilder';
import { BalanceChangeType } from '../../src/caveatBuilder/types';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('nativeBalanceChangeBuilder', () => {
  const EXPECTED_TERMS_LENGTH = 53; // 1 byte for changeType + 20 bytes for recipient address + 32 bytes for balance

  const environment = {
    caveatEnforcers: { NativeBalanceChangeEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    recipient: Address,
    balance: bigint,
    changeType: BalanceChangeType,
  ) => {
    const config = { recipient, balance, changeType };
    return nativeBalanceChangeBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with invalid recipient address', () => {
      const invalidRecipient = 'Not-an-address' as Address;
      const balance = 100n;

      expect(() =>
        buildWithParams(invalidRecipient, balance, BalanceChangeType.Increase),
      ).to.throw('Invalid recipient: must be a valid Address');
    });

    it('should fail with non-positive amount', () => {
      const recipient = randomAddress();
      const balance = 0n;

      expect(() =>
        buildWithParams(recipient, balance, BalanceChangeType.Increase),
      ).to.throw('Invalid balance: must be a positive number');
    });

    it('should fail with an invalid changeType', () => {
      const recipient = randomAddress();
      const balance = 1000n;
      const invalidChangeType = 2 as BalanceChangeType;

      expect(() =>
        buildWithParams(recipient, balance, invalidChangeType),
      ).to.throw('Invalid changeType: must be either Increase or Decrease');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters for increase', () => {
      const recipient = randomAddress();
      const balance = 1000n;

      const caveat = buildWithParams(
        recipient,
        balance,
        BalanceChangeType.Increase,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'uint256'],
        [BalanceChangeType.Increase, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with valid parameters for decrease', () => {
      const recipient = randomAddress();
      const balance = 1000n;

      const caveat = buildWithParams(
        recipient,
        balance,
        BalanceChangeType.Decrease,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'uint256'],
        [BalanceChangeType.Decrease, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with minimum positive amount', () => {
      const recipient = randomAddress();
      const balance = 1n;

      const caveat = buildWithParams(
        recipient,
        balance,
        BalanceChangeType.Increase,
      );
      const terms = encodePacked(
        ['uint8', 'address', 'uint256'],
        [BalanceChangeType.Increase, recipient, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeBalanceChangeEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching expected size', () => {
    const recipient = randomAddress();
    const balance = 1000n;

    const caveat = buildWithParams(
      recipient,
      balance,
      BalanceChangeType.Increase,
    );

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
