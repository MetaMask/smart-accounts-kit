import { describe, it, expect } from 'vitest';

import { createERC20TransferAmountTerms } from '../../src/caveats/erc20TransferAmount';

describe('createERC20TransferAmountTerms', () => {
  const tokenAddress = '0x0000000000000000000000000000000000000011';

  it('creates valid terms for token and amount', () => {
    const result = createERC20TransferAmountTerms({
      tokenAddress,
      maxAmount: 10n,
    });

    expect(result).toStrictEqual(
      '0x0000000000000000000000000000000000000011' +
        '000000000000000000000000000000000000000000000000000000000000000a',
    );
  });

  it('throws for invalid token address', () => {
    expect(() =>
      createERC20TransferAmountTerms({
        tokenAddress: '0x1234',
        maxAmount: 10n,
      }),
    ).toThrow('Invalid tokenAddress: must be a valid address');
  });

  it('throws for invalid maxAmount', () => {
    expect(() =>
      createERC20TransferAmountTerms({
        tokenAddress,
        maxAmount: 0n,
      }),
    ).toThrow('Invalid maxAmount: must be a positive number');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createERC20TransferAmountTerms(
      { tokenAddress, maxAmount: 1n },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(52);
  });
});
