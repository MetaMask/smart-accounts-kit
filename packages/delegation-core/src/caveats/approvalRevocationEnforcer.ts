/**
 * ## ApprovalRevocationEnforcer
 *
 * Grants authority to revoke token approvals via:
 * - ERC-20 `approve(spender, 0)` (spender non-zero, amount zero)
 * - ERC-721 per-token `approve(address(0), tokenId)`
 * - ERC-721 / ERC-1155 `setApprovalForAll(operator, false)`
 *
 * Terms are encoded as exactly **one byte**, interpreted as a bitmask:
 * - Bit 0 (`0x01`): ERC-20 zero-amount approval
 * - Bit 1 (`0x02`): ERC-721 per-token clear
 * - Bit 2 (`0x04`): `setApprovalForAll(operator, false)`
 *
 * Bits 3–7 must be zero on the wire.
 */

import type { BytesLike } from '@metamask/utils';

import {
  assertHexByteExactLength,
  extractNumber,
  toHexString,
} from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/** Bit 0 — internal wire encoding only. */
const BIT_ERC20_APPROVE_ZERO = 0x01;
/** Bit 1 — internal wire encoding only. */
const BIT_ERC721_PER_TOKEN_CLEAR = 0x02;
/** Bit 2 — internal wire encoding only. */
const BIT_SET_APPROVAL_FOR_ALL_REVOKE = 0x04;

const ALLOWED_APPROVAL_REVOCATION_MAX_MASK =
  BIT_ERC20_APPROVE_ZERO +
  BIT_ERC721_PER_TOKEN_CLEAR +
  BIT_SET_APPROVAL_FOR_ALL_REVOKE;

/**
 * Human-readable selection of which revocation forms the caveat allows.
 * Encode with {@link createApprovalRevocationTerms}; decode with {@link decodeApprovalRevocationTerms}.
 */
export type ApprovalRevocationTerms = {
  /** Allow revoking ERC-20 allowances via `approve(spender, 0)`. */
  erc20Approve: boolean;
  /** Allow clearing ERC-721 per-token approval via `approve(address(0), tokenId)`. */
  erc721Approve: boolean;
  /** Allow revoking operator access via `setApprovalForAll(operator, false)` (ERC-721 / ERC-1155). */
  erc721SetApprovalForAll: boolean;
};

/**
 * Maps {@link ApprovalRevocationTerms} to the single-byte bitmask on the wire.
 *
 * @param terms - Selected revocation forms.
 * @returns Integer mask in `0`..`0x07`.
 */
function termsToMask(terms: ApprovalRevocationTerms): number {
  let mask = 0;
  if (terms.erc20Approve) {
    mask += BIT_ERC20_APPROVE_ZERO;
  }
  if (terms.erc721Approve) {
    mask += BIT_ERC721_PER_TOKEN_CLEAR;
  }
  if (terms.erc721SetApprovalForAll) {
    mask += BIT_SET_APPROVAL_FOR_ALL_REVOKE;
  }
  return mask;
}

/**
 * Parses a validated 0..7 bitmask into {@link ApprovalRevocationTerms}.
 *
 * @param mask - Integer byte value; only bits 0–2 may be set.
 * @returns Flag object for encoding/decoding.
 */
function maskToTerms(mask: number): ApprovalRevocationTerms {
  if (!Number.isInteger(mask) || mask < 0 || mask > 255) {
    throw new Error(
      'Invalid ApprovalRevocation mask: must be an integer between 0 and 255',
    );
  }

  if (mask > ALLOWED_APPROVAL_REVOCATION_MAX_MASK) {
    throw new Error(
      'Invalid ApprovalRevocation terms: reserved bits must be zero (only bits 0–2 are defined)',
    );
  }

  return {
    erc20Approve: mask % 2 !== 0,
    erc721Approve: Math.floor(mask / 2) % 2 !== 0,
    erc721SetApprovalForAll: Math.floor(mask / 4) % 2 !== 0,
  };
}

/**
 * Creates terms for an ApprovalRevocation caveat.
 *
 * @param terms - Which revocation forms are permitted.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms (one byte).
 */
export function createApprovalRevocationTerms(
  terms: ApprovalRevocationTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createApprovalRevocationTerms(
  terms: ApprovalRevocationTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * @param terms - Which revocation forms are permitted.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms (one byte).
 */
export function createApprovalRevocationTerms(
  terms: ApprovalRevocationTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const mask = termsToMask(terms);
  const hexValue = `0x${toHexString({ value: mask, size: 1 })}`;
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ApprovalRevocation caveat from encoded data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array (exactly one byte).
 * @returns The decoded {@link ApprovalRevocationTerms}.
 */
export function decodeApprovalRevocationTerms(
  terms: BytesLike,
): ApprovalRevocationTerms {
  const hexTerms = bytesLikeToHex(terms);
  assertHexByteExactLength(
    hexTerms,
    1,
    'Invalid ApprovalRevocation terms: must be exactly 1 byte',
  );
  const mask = extractNumber(hexTerms, 0, 1);
  return maskToTerms(mask);
}
