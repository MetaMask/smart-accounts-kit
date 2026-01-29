import { describe, it, expect } from 'vitest';

import { createERC721BalanceChangeTerms } from '../../src/caveats/erc721BalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('createERC721BalanceChangeTerms', () => {
  const tokenAddress = '0x00000000000000000000000000000000000000aa';
  const recipient = '0x00000000000000000000000000000000000000bb';

  it('creates valid terms for balance increase', () => {
    const result = createERC721BalanceChangeTerms({
      tokenAddress,
      recipient,
      amount: 1n,
      changeType: BalanceChangeType.Increase,
    });

    expect(result).toStrictEqual(
      '0x00' +
        '00000000000000000000000000000000000000aa' +
        '00000000000000000000000000000000000000bb' +
        '0000000000000000000000000000000000000000000000000000000000000001',
    );
  });

  it('throws for invalid recipient', () => {
    expect(() =>
      createERC721BalanceChangeTerms({
        tokenAddress,
        recipient: '0x1234',
        amount: 1n,
        changeType: BalanceChangeType.Increase,
      }),
    ).toThrow('Invalid recipient: must be a valid address');
  });

  it('throws for invalid amount', () => {
    expect(() =>
      createERC721BalanceChangeTerms({
        tokenAddress,
        recipient,
        amount: 0n,
        changeType: BalanceChangeType.Decrease,
      }),
    ).toThrow('Invalid balance: must be a positive number');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createERC721BalanceChangeTerms(
      {
        tokenAddress,
        recipient,
        amount: 2n,
        changeType: BalanceChangeType.Decrease,
      },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(73);
  });
});
