import { describe, it, expect } from 'vitest';

import { createNativeTokenPaymentTerms } from '../../src/caveats/nativeTokenPayment';

describe('createNativeTokenPaymentTerms', () => {
  const recipient = '0x00000000000000000000000000000000000000bb';

  it('creates valid terms for recipient and amount', () => {
    const result = createNativeTokenPaymentTerms({
      recipient,
      amount: 10n,
    });

    expect(result).toStrictEqual(
      '0x00000000000000000000000000000000000000bb' +
        '000000000000000000000000000000000000000000000000000000000000000a',
    );
  });

  it('throws for invalid recipient', () => {
    expect(() =>
      createNativeTokenPaymentTerms({
        recipient: '0x1234',
        amount: 1n,
      }),
    ).toThrow('Invalid recipient: must be a valid address');
  });

  it('throws for non-positive amount', () => {
    expect(() =>
      createNativeTokenPaymentTerms({
        recipient,
        amount: 0n,
      }),
    ).toThrow('Invalid amount: must be positive');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createNativeTokenPaymentTerms(
      { recipient, amount: 5n },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(52);
  });
});
