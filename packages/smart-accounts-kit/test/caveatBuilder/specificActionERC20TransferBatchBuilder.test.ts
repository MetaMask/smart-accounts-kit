import { concat, size, toHex } from 'viem';
import type { Address, Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { specificActionERC20TransferBatchBuilder } from '../../src/caveatBuilder/specificActionERC20TransferBatchBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('specificActionERC20TransferBatchBuilder()', () => {
  const EXPECTED_TERMS_MIN_LENGTH = 92;
  const environment = {
    caveatEnforcers: {
      SpecificActionERC20TransferBatchEnforcer: randomAddress(),
    },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    tokenAddress: Address,
    recipient: Address,
    amount: bigint,
    target: Address,
    calldata: Hex,
  ) => {
    const config = {
      tokenAddress,
      recipient,
      amount,
      target,
      calldata,
    };
    return specificActionERC20TransferBatchBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid token address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(
          invalidAddress,
          randomAddress(),
          1000n,
          randomAddress(),
          '0x',
        ),
      ).to.throw('Invalid tokenAddress: must be a valid address');
    });

    it('should fail with an invalid recipient address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(
          randomAddress(),
          invalidAddress,
          1000n,
          randomAddress(),
          '0x',
        ),
      ).to.throw('Invalid recipient: must be a valid address');
    });

    it('should fail with an invalid target address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(
          randomAddress(),
          randomAddress(),
          1000n,
          invalidAddress,
          '0x',
        ),
      ).to.throw('Invalid target: must be a valid address');
    });

    it('should fail with a non-positive amount', () => {
      expect(() =>
        buildWithParams(
          randomAddress(),
          randomAddress(),
          0n,
          randomAddress(),
          '0x',
        ),
      ).to.throw('Invalid amount: must be a positive number');
      expect(() =>
        buildWithParams(
          randomAddress(),
          randomAddress(),
          -1n,
          randomAddress(),
          '0x',
        ),
      ).to.throw('Invalid amount: must be a positive number');
    });

    it('should allow valid addresses that are not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() =>
        buildWithParams(
          nonChecksummedAddress,
          nonChecksummedAddress,
          1000n,
          nonChecksummedAddress,
          '0x',
        ),
      ).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const amount = 1000000n;
      const target = randomAddress();
      const calldata = '0x12345678' as const;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        amount,
        target,
        calldata,
      );

      expect(caveat.enforcer).to.equal(
        environment.caveatEnforcers.SpecificActionERC20TransferBatchEnforcer,
      );
      expect(caveat.args).to.equal('0x00');

      // Verify terms encoding
      const expectedTerms = concat([
        tokenAddress,
        recipient,
        toHex(amount, { size: 32 }),
        target,
        calldata,
      ]);
      expect(caveat.terms).to.equal(expectedTerms);
    });

    it('should build a caveat that is at least the minimum byte length', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const amount = 1000000n;
      const target = randomAddress();
      const calldata = '0x' as const;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        amount,
        target,
        calldata,
      );

      expect(size(caveat.terms)).to.be.greaterThanOrEqual(
        EXPECTED_TERMS_MIN_LENGTH,
      );
    });
  });
});
