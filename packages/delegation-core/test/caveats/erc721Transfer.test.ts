import { describe, it, expect } from 'vitest';

import {
  createERC721TransferTerms,
  decodeERC721TransferTerms,
} from '../../src/caveats/erc721Transfer';

describe('ERC721Transfer', () => {
  describe('createERC721TransferTerms', () => {
    const tokenAddress = '0x00000000000000000000000000000000000000aa';

    it('creates valid terms for token and tokenId', () => {
      const result = createERC721TransferTerms({
        tokenAddress,
        tokenId: 42n,
      });

      expect(result).toStrictEqual(
        '0x00000000000000000000000000000000000000aa' +
          '000000000000000000000000000000000000000000000000000000000000002a',
      );
    });

    it('throws for invalid token address', () => {
      expect(() =>
        createERC721TransferTerms({
          tokenAddress: '0x1234',
          tokenId: 1n,
        }),
      ).toThrow('Invalid tokenAddress: must be a valid address');
    });

    it('throws for negative tokenId', () => {
      expect(() =>
        createERC721TransferTerms({
          tokenAddress,
          tokenId: -1n,
        }),
      ).toThrow('Invalid tokenId: must be a non-negative number');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createERC721TransferTerms(
        { tokenAddress, tokenId: 1n },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(52);
    });
  });

  describe('decodeERC721TransferTerms', () => {
    const tokenAddress =
      '0x00000000000000000000000000000000000000aa' as `0x${string}`;

    it('decodes token address and token id', () => {
      const original = { tokenAddress, tokenId: 42n };
      expect(
        decodeERC721TransferTerms(createERC721TransferTerms(original)),
      ).toStrictEqual(original);
    });

    it('decodes token id zero', () => {
      const original = { tokenAddress, tokenId: 0n };
      expect(
        decodeERC721TransferTerms(createERC721TransferTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = { tokenAddress, tokenId: 1n };
      const bytes = createERC721TransferTerms(original, { out: 'bytes' });
      expect(decodeERC721TransferTerms(bytes)).toStrictEqual(original);
    });

    it('throws when encoded terms are not exactly 52 bytes', () => {
      expect(() => decodeERC721TransferTerms(`0x${'00'.repeat(51)}`)).toThrow(
        'Invalid ERC721Transfer terms: must be exactly 52 bytes',
      );
    });
  });
});
