import { describe, it, expect } from 'vitest';

import {
  createApprovalRevocationTerms,
  decodeApprovalRevocationTerms,
  type ApprovalRevocationTerms,
} from '../../src/caveats/approvalRevocationEnforcer';

const ALL_FALSE = {
  erc20Approve: false,
  erc721Approve: false,
  erc721SetApprovalForAll: false,
} satisfies ApprovalRevocationTerms;

/** Every valid on-chain byte 0..7 as decoded terms (spec bit layout). */
const ALL_VALID_TERM_SETS: ApprovalRevocationTerms[] = [
  ALL_FALSE,
  { erc20Approve: true, erc721Approve: false, erc721SetApprovalForAll: false },
  { erc20Approve: false, erc721Approve: true, erc721SetApprovalForAll: false },
  { erc20Approve: true, erc721Approve: true, erc721SetApprovalForAll: false },
  { erc20Approve: false, erc721Approve: false, erc721SetApprovalForAll: true },
  { erc20Approve: true, erc721Approve: false, erc721SetApprovalForAll: true },
  { erc20Approve: false, erc721Approve: true, erc721SetApprovalForAll: true },
  {
    erc20Approve: true,
    erc721Approve: true,
    erc721SetApprovalForAll: true,
  },
];

describe('ApprovalRevocationEnforcer', () => {
  describe('createApprovalRevocationTerms', () => {
    const BYTE_LEN = 1;

    it('encodes only ERC-20 zero-amount approval revocation', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          erc20Approve: true,
        }),
      ).toBe('0x01');
    });

    it('encodes ERC-721 clear per-token approval', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          erc721Approve: true,
        }),
      ).toBe('0x02');
    });

    it('encodes setApprovalForAll(operator, false)', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          erc721SetApprovalForAll: true,
        }),
      ).toBe('0x04');
    });

    it('combines flags', () => {
      expect(
        createApprovalRevocationTerms({
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
        }),
      ).toBe('0x07');
    });

    it('encodes all-false as 0x00', () => {
      expect(createApprovalRevocationTerms(ALL_FALSE)).toBe('0x00');
    });

    describe('bytes return type', () => {
      it('returns one byte', () => {
        const encodedBytes = createApprovalRevocationTerms(
          {
            erc20Approve: true,
            erc721Approve: true,
            erc721SetApprovalForAll: false,
          },
          { out: 'bytes' },
        );
        expect(encodedBytes).toBeInstanceOf(Uint8Array);
        expect(encodedBytes).toHaveLength(BYTE_LEN);
        expect(encodedBytes[0]).toBe(0x03);
      });
    });
  });

  describe('decodeApprovalRevocationTerms', () => {
    it('round-trips with createApprovalRevocationTerms', () => {
      const original: ApprovalRevocationTerms = {
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: true,
      };
      const encoded = createApprovalRevocationTerms(original);
      expect(decodeApprovalRevocationTerms(encoded)).toStrictEqual(original);
    });

    it('round-trips every valid combination', () => {
      for (const terms of ALL_VALID_TERM_SETS) {
        expect(
          decodeApprovalRevocationTerms(createApprovalRevocationTerms(terms)),
        ).toStrictEqual(terms);
      }
    });

    it('accepts Uint8Array', () => {
      const bytes = createApprovalRevocationTerms(
        {
          erc20Approve: false,
          erc721Approve: false,
          erc721SetApprovalForAll: true,
        },
        { out: 'bytes' },
      );
      expect(decodeApprovalRevocationTerms(bytes)).toStrictEqual({
        erc20Approve: false,
        erc721Approve: false,
        erc721SetApprovalForAll: true,
      });
    });

    it('throws when length is not 1 byte', () => {
      expect(() => decodeApprovalRevocationTerms('0x')).toThrow(
        'must be exactly 1 byte',
      );
      expect(() => decodeApprovalRevocationTerms('0x0102')).toThrow(
        'must be exactly 1 byte',
      );
    });

    it('throws when reserved bits are set on-chain', () => {
      expect(() => decodeApprovalRevocationTerms('0x08')).toThrow(
        'reserved bits must be zero',
      );
      expect(() => decodeApprovalRevocationTerms('0xff')).toThrow(
        'reserved bits must be zero',
      );
    });
  });
});
