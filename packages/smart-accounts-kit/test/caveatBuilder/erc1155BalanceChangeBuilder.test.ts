import { encodePacked, size, type Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc1155BalanceChangeBuilder } from '../../src/caveatBuilder/erc1155BalanceChangeBuilder';
import { BalanceChangeType } from '../../src/caveatBuilder/types';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc1155BalanceChangeBuilder', () => {
  const EXPECTED_TERMS_LENGTH = 105; // 1 byte for changeType + 20 bytes for token address + 20 bytes for recipient + 32 bytes for tokenId + 32 bytes for balance

  const environment = {
    caveatEnforcers: { ERC1155BalanceChangeEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (
    tokenAddress: Address,
    recipient: Address,
    tokenId: bigint,
    balance: bigint,
    changeType: BalanceChangeType,
  ) => {
    const config = { tokenAddress, recipient, tokenId, balance, changeType };
    return erc1155BalanceChangeBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid token address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(
          invalidAddress,
          randomAddress(),
          1n,
          1000n,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid tokenAddress: must be a valid address');
    });

    it('should fail with an invalid recipient address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() =>
        buildWithParams(
          randomAddress(),
          invalidAddress,
          1n,
          1000n,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid recipient: must be a valid address');
    });

    it('should fail with a non-positive balance', () => {
      const validAddress = randomAddress();
      expect(() =>
        buildWithParams(
          validAddress,
          randomAddress(),
          1n,
          0n,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid balance: must be a positive number');
      expect(() =>
        buildWithParams(
          validAddress,
          randomAddress(),
          1n,
          -1n,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid balance: must be a positive number');
    });

    it('should allow a valid address that is not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() =>
        buildWithParams(
          nonChecksummedAddress,
          randomAddress(),
          1n,
          1000n,
          BalanceChangeType.Increase,
        ),
      ).to.not.throw();
    });

    it('should fail with an invalid tokenId', () => {
      const validAddress = randomAddress();
      expect(() =>
        buildWithParams(
          validAddress,
          randomAddress(),
          -1n,
          1000n,
          BalanceChangeType.Increase,
        ),
      ).to.throw('Invalid tokenId: must be a non-negative number');
    });

    it('should fail with an invalid changeType', () => {
      const validAddress = randomAddress();
      const invalidChangeType = 2 as BalanceChangeType;
      expect(() =>
        buildWithParams(
          validAddress,
          randomAddress(),
          1n,
          1000n,
          invalidChangeType,
        ),
      ).to.throw('Invalid changeType: must be either Increase or Decrease');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters for increase', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const tokenId = 1n;
      const balance = 1000000n;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        tokenId,
        balance,
        BalanceChangeType.Increase,
      );
      const expectedTerms = encodePacked(
        ['uint8', 'address', 'address', 'uint256', 'uint256'],
        [BalanceChangeType.Increase, tokenAddress, recipient, tokenId, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC1155BalanceChangeEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should build a caveat with valid parameters for decrease', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const tokenId = 1n;
      const balance = 1000000n;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        tokenId,
        balance,
        BalanceChangeType.Decrease,
      );
      const expectedTerms = encodePacked(
        ['uint8', 'address', 'address', 'uint256', 'uint256'],
        [BalanceChangeType.Decrease, tokenAddress, recipient, tokenId, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC1155BalanceChangeEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should correctly handle large balances', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const tokenId = 1n;
      const balance = 2n ** 32n - 1n; // Maximum possible value for uint32

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        tokenId,
        balance,
        BalanceChangeType.Increase,
      );
      const expectedTerms = encodePacked(
        ['uint8', 'address', 'address', 'uint256', 'uint256'],
        [BalanceChangeType.Increase, tokenAddress, recipient, tokenId, balance],
      );

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC1155BalanceChangeEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });

    it('should create a caveat with terms of the correct length', () => {
      const tokenAddress = randomAddress();
      const recipient = randomAddress();
      const tokenId = 1n;
      const balance = 1000n;

      const caveat = buildWithParams(
        tokenAddress,
        recipient,
        tokenId,
        balance,
        BalanceChangeType.Increase,
      );

      expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
    });
  });
});
