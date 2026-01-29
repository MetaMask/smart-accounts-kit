import { describe, it, expect } from 'vitest';

import { createERC721TransferTerms } from '../../src/caveats/erc721Transfer';

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
