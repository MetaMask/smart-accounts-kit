import { describe, it, expect } from 'vitest';

import { createNativeBalanceChangeTerms } from '../../src/caveats/nativeBalanceChange';
import { BalanceChangeType } from '../../src/caveats/types';

describe('createNativeBalanceChangeTerms', () => {
  const recipient = '0x00000000000000000000000000000000000000cc';

  it('creates valid terms for balance increase', () => {
    const result = createNativeBalanceChangeTerms({
      recipient,
      balance: 1n,
      changeType: BalanceChangeType.Increase,
    });

    expect(result).toStrictEqual(
      '0x00' +
        '00000000000000000000000000000000000000cc' +
        '0000000000000000000000000000000000000000000000000000000000000001',
    );
  });

  it('throws for invalid recipient', () => {
    expect(() =>
      createNativeBalanceChangeTerms({
        recipient: '0x1234',
        balance: 1n,
        changeType: BalanceChangeType.Increase,
      }),
    ).toThrow('Invalid recipient: must be a valid Address');
  });

  it('throws for invalid balance', () => {
    expect(() =>
      createNativeBalanceChangeTerms({
        recipient,
        balance: 0n,
        changeType: BalanceChangeType.Increase,
      }),
    ).toThrow('Invalid balance: must be a positive number');
  });

  it('throws for invalid changeType', () => {
    expect(() =>
      createNativeBalanceChangeTerms({
        recipient,
        balance: 1n,
        changeType: 2 as any,
      }),
    ).toThrow('Invalid changeType: must be either Increase or Decrease');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createNativeBalanceChangeTerms(
      {
        recipient,
        balance: 2n,
        changeType: BalanceChangeType.Decrease,
      },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(53);
  });
});
