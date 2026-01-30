import { describe, it, expect } from 'vitest';

import { createSpecificActionERC20TransferBatchTerms } from '../../src/caveats/specificActionERC20TransferBatch';

describe('createSpecificActionERC20TransferBatchTerms', () => {
  const tokenAddress = '0x0000000000000000000000000000000000000011';
  const recipient = '0x0000000000000000000000000000000000000022';
  const target = '0x0000000000000000000000000000000000000033';

  it('creates valid terms for specific action batch', () => {
    const result = createSpecificActionERC20TransferBatchTerms({
      tokenAddress,
      recipient,
      amount: 1n,
      target,
      calldata: '0x1234',
    });

    expect(result).toStrictEqual(
      '0x0000000000000000000000000000000000000011' +
        '0000000000000000000000000000000000000022' +
        '0000000000000000000000000000000000000000000000000000000000000001' +
        '0000000000000000000000000000000000000033' +
        '1234',
    );
  });

  it('throws for invalid token address', () => {
    expect(() =>
      createSpecificActionERC20TransferBatchTerms({
        tokenAddress: '0x1234',
        recipient,
        amount: 1n,
        target,
        calldata: '0x',
      }),
    ).toThrow('Invalid tokenAddress: must be a valid address');
  });

  it('throws for invalid amount', () => {
    expect(() =>
      createSpecificActionERC20TransferBatchTerms({
        tokenAddress,
        recipient,
        amount: 0n,
        target,
        calldata: '0x',
      }),
    ).toThrow('Invalid amount: must be a positive number');
  });

  it('throws when calldata string does not start with 0x', () => {
    expect(() =>
      createSpecificActionERC20TransferBatchTerms({
        tokenAddress,
        recipient,
        amount: 1n,
        target,
        calldata: '1234' as `0x${string}`,
      }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createSpecificActionERC20TransferBatchTerms(
      {
        tokenAddress,
        recipient,
        amount: 2n,
        target,
        calldata: '0x1234',
      },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(94);
  });
});
