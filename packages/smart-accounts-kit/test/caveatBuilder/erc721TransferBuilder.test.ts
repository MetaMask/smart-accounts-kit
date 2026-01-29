import { concat, size, toHex, type Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { erc721TransferBuilder } from '../../src/caveatBuilder/erc721TransferBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('erc721TransferBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 52; // 20 bytes for contract address + 32 bytes for token ID

  const environment = {
    caveatEnforcers: { ERC721TransferEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (tokenAddress: Address, tokenId: bigint) => {
    const config = { tokenAddress, tokenId };
    return erc721TransferBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with an invalid contract address', () => {
      const invalidAddress = 'invalid-address' as Address;
      expect(() => buildWithParams(invalidAddress, 1n)).to.throw(
        'Invalid tokenAddress: must be a valid address',
      );
    });

    it('should fail with a negative token ID', () => {
      const validAddress = randomAddress();
      expect(() => buildWithParams(validAddress, -1n)).to.throw(
        'Invalid tokenId: must be a non-negative number',
      );
    });

    it('should allow a zero token ID', () => {
      const validAddress = randomAddress();
      expect(() => buildWithParams(validAddress, 0n)).to.not.throw();
    });

    it('should allow a valid address that is not checksummed', () => {
      const nonChecksummedAddress = randomAddress().toLowerCase() as Address;
      expect(() => buildWithParams(nonChecksummedAddress, 1n)).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const tokenAddress = randomAddress();
      const tokenId = 1n;

      const caveat = buildWithParams(tokenAddress, tokenId);
      const expectedTerms = concat([
        tokenAddress,
        toHex(tokenId, { size: 32 }),
      ]).toLowerCase();

      expect({ ...caveat, terms: caveat.terms.toLowerCase() }).to.deep.equal({
        enforcer: environment.caveatEnforcers.ERC721TransferEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms of the correct length', () => {
    const tokenAddress = randomAddress();
    const tokenId = 1n;

    const caveat = buildWithParams(tokenAddress, tokenId);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
