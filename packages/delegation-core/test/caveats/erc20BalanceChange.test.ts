import { describe, it, expect } from 'vitest';

import { createERC20BalanceChangeTerms } from '../../src/caveats/erc20BalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('createERC20BalanceChangeTerms', () => {
  const tokenAddress = '0x00000000000000000000000000000000000000dd';
  const recipient = '0x00000000000000000000000000000000000000ee';

  it('creates valid terms for balance decrease', () => {
    const result = createERC20BalanceChangeTerms({
      tokenAddress,
      recipient,
      balance: 5n,
      changeType: BalanceChangeType.Decrease,
    });

    expect(result).toStrictEqual(
      '0x01' +
        '00000000000000000000000000000000000000dd' +
        '00000000000000000000000000000000000000ee' +
        '0000000000000000000000000000000000000000000000000000000000000005',
    );
  });

  it('throws for invalid token address', () => {
    expect(() =>
      createERC20BalanceChangeTerms({
        tokenAddress: '0x1234',
        recipient,
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      }),
    ).toThrow('Invalid tokenAddress: must be a valid address');
  });

  it('throws for invalid balance', () => {
    expect(() =>
      createERC20BalanceChangeTerms({
        tokenAddress,
        recipient,
        balance: 0n,
        changeType: BalanceChangeType.Increase,
      }),
    ).toThrow('Invalid balance: must be a positive number');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createERC20BalanceChangeTerms(
      {
        tokenAddress,
        recipient,
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(73);
  });
});
