import { describe, it, expect } from 'vitest';

import { createOwnershipTransferTerms } from '../../src/caveats/ownershipTransfer';

describe('createOwnershipTransferTerms', () => {
  const contractAddress = '0x00000000000000000000000000000000000000ff';

  it('creates valid terms for contract address', () => {
    const result = createOwnershipTransferTerms({ contractAddress });

    expect(result).toStrictEqual(contractAddress);
  });

  it('throws for invalid contract address', () => {
    expect(() =>
      createOwnershipTransferTerms({ contractAddress: '0x1234' }),
    ).toThrow('Invalid contractAddress: must be a valid address');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createOwnershipTransferTerms(
      { contractAddress },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(20);
  });
});
