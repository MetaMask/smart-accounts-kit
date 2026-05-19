/* eslint-disable no-bitwise */
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
  permit2Approve: false,
  permit2Lockdown: false,
  permit2InvalidateNonces: false,
} satisfies ApprovalRevocationTerms;

/** Every valid on-chain byte 1..63 as decoded terms (spec bit layout). */
const ALL_VALID_TERM_SETS: ApprovalRevocationTerms[] = Array.from(
  { length: 0x3f },
  (_, index) => {
    const mask = index + 1;
    return {
      erc20Approve: (mask & 0x01) !== 0,
      erc721Approve: (mask & 0x02) !== 0,
      erc721SetApprovalForAll: (mask & 0x04) !== 0,
      permit2Approve: (mask & 0x08) !== 0,
      permit2Lockdown: (mask & 0x10) !== 0,
      permit2InvalidateNonces: (mask & 0x20) !== 0,
    };
  },
);

const RESERVED_BITS_ERROR =
  'Invalid ApprovalRevocation terms: reserved bits must be zero (only bits 0-5 are defined)';

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

    it('encodes Permit2 approve(token, spender, 0, 0)', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          permit2Approve: true,
        }),
      ).toBe('0x08');
    });

    it('encodes Permit2 lockdown((address,address)[])', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          permit2Lockdown: true,
        }),
      ).toBe('0x10');
    });

    it('encodes Permit2 invalidateNonces(token, spender, newNonce)', () => {
      expect(
        createApprovalRevocationTerms({
          ...ALL_FALSE,
          permit2InvalidateNonces: true,
        }),
      ).toBe('0x20');
    });

    it('combines all revocation primitive flags', () => {
      expect(
        createApprovalRevocationTerms({
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        }),
      ).toBe('0x3f');
    });

    it('throws when no flags are set', () => {
      expect(() => createApprovalRevocationTerms(ALL_FALSE)).toThrow(
        'at least one revocation primitive must be enabled',
      );
    });

    describe('bytes return type', () => {
      it('returns one byte', () => {
        const encodedBytes = createApprovalRevocationTerms(
          {
            erc20Approve: true,
            erc721Approve: true,
            erc721SetApprovalForAll: false,
            permit2Approve: true,
            permit2Lockdown: false,
            permit2InvalidateNonces: true,
          },
          { out: 'bytes' },
        );
        expect(encodedBytes).toBeInstanceOf(Uint8Array);
        expect(encodedBytes).toHaveLength(BYTE_LEN);
        expect(encodedBytes[0]).toBe(0x2b);
      });
    });
  });

  describe('decodeApprovalRevocationTerms', () => {
    it('round-trips with createApprovalRevocationTerms', () => {
      const original: ApprovalRevocationTerms = {
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: true,
        permit2Approve: false,
        permit2Lockdown: true,
        permit2InvalidateNonces: true,
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
          permit2Approve: true,
          permit2Lockdown: false,
          permit2InvalidateNonces: true,
        },
        { out: 'bytes' },
      );
      expect(decodeApprovalRevocationTerms(bytes)).toStrictEqual({
        erc20Approve: false,
        erc721Approve: false,
        erc721SetApprovalForAll: true,
        permit2Approve: true,
        permit2Lockdown: false,
        permit2InvalidateNonces: true,
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
      expect(() => decodeApprovalRevocationTerms('0x40')).toThrow(
        RESERVED_BITS_ERROR,
      );
      expect(() => decodeApprovalRevocationTerms('0x80')).toThrow(
        RESERVED_BITS_ERROR,
      );
      expect(() => decodeApprovalRevocationTerms('0xff')).toThrow(
        RESERVED_BITS_ERROR,
      );
    });

    it('throws when no flags are set on-chain', () => {
      expect(() => decodeApprovalRevocationTerms('0x00')).toThrow(
        'at least one revocation primitive must be enabled',
      );
    });
  });
});
