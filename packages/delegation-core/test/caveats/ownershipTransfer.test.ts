import { describe, it, expect } from 'vitest';

import {
  createOwnershipTransferTerms,
  decodeOwnershipTransferTerms,
} from '../../src/caveats/ownershipTransfer';

describe('OwnershipTransfer', () => {
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

  describe('decodeOwnershipTransferTerms', () => {
    const contractAddress =
      '0x00000000000000000000000000000000000000ff' as `0x${string}`;

    it('decodes contract address', () => {
      expect(
        decodeOwnershipTransferTerms(
          createOwnershipTransferTerms({ contractAddress }),
        ),
      ).toStrictEqual({ contractAddress });
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const bytes = createOwnershipTransferTerms(
        { contractAddress },
        { out: 'bytes' },
      );
      expect(decodeOwnershipTransferTerms(bytes)).toStrictEqual({
        contractAddress,
      });
    });

    it('throws when encoded terms are not exactly 20 bytes', () => {
      expect(() =>
        decodeOwnershipTransferTerms(`0x${'00'.repeat(19)}`),
      ).toThrow('Invalid OwnershipTransfer terms: must be exactly 20 bytes');
    });
  });
});
