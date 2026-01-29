import { concat, size, toHex, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { nativeTokenPaymentBuilder } from '../../src/caveatBuilder/nativeTokenPaymentBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('nativeTokenPaymentBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 52; // 20 bytes for the recipient address + 32 bytes for the amount

  const environment = {
    caveatEnforcers: { NativeTokenPaymentEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithAmountAndRecipient = (recipient: Hex, amount: bigint) => {
    const config = { recipient, amount };
    return nativeTokenPaymentBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with non-positive amount', () => {
      expect(() => buildWithAmountAndRecipient(randomAddress(), 0n)).to.throw(
        'Invalid amount: must be positive',
      );
      expect(() => buildWithAmountAndRecipient(randomAddress(), -1n)).to.throw(
        'Invalid amount: must be positive',
      );
    });

    it('should fail with invalid recipient address', () => {
      expect(() =>
        buildWithAmountAndRecipient('0xinvalid' as Hex, 100n),
      ).to.throw('Invalid recipient: must be a valid address');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid amount and recipient', () => {
      const amount = 1000000000000000000n; // 1 ETH
      const recipient = randomAddress('lowercase'); // lowerCase because abi encoding lowercases addresses
      const caveat = buildWithAmountAndRecipient(recipient, amount);

      const amountHex = toHex(amount, { size: 32 });
      const expectedTerms = concat([recipient, amountHex]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeTokenPaymentEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with minimum possible amount', () => {
      const amount = 1n;
      const recipient = randomAddress('lowercase'); // lowerCase because abi encoding lowercases addressesç

      const caveat = buildWithAmountAndRecipient(recipient, amount);

      const amountHex = toHex(amount, { size: 32 });
      const expectedTerms = concat([recipient, amountHex]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.NativeTokenPaymentEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const amount = 1000000000000000000n; // 1 ETH
    const recipient = randomAddress('lowercase'); // lowerCase because abi encoding lowercases addresses

    const caveat = buildWithAmountAndRecipient(recipient, amount);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
