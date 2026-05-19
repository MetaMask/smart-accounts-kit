/* eslint-disable no-bitwise */
/**
 * ## ApprovalRevocationEnforcer
 *
 * Grants authority to revoke token approvals via:
 * - ERC-20 `approve(spender, 0)` (spender non-zero, amount zero)
 * - ERC-721 per-token `approve(address(0), tokenId)`
 * - ERC-721 / ERC-1155 `setApprovalForAll(operator, false)`
 *
 * Terms are encoded as exactly **one byte**, interpreted as a bitmask:
 * | Bit | Hex mask | Revocation primitive |
 * |-----|----------|-------------------|
 * | 0   | `0x01`   | ERC-20 `approve(spender, 0)` |
 * | 1   | `0x02`   | ERC-721 `approve(address(0), tokenId)` |
 * | 2   | `0x04`   | `setApprovalForAll(operator, false)` (ERC-721 & ERC-1155) |
 * | 3   | `0x08`   | Permit2 `approve(token, spender, 0, 0)` |
 * | 4   | `0x10`   | Permit2 `lockdown((address,address)[])` |
 * | 5   | `0x20`   | Permit2 `invalidateNonces(token, spender, newNonce)` | *
 *
 * Bits 6–7 must be zero on the wire.
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

const BIT_ERC20_APPROVE_ZERO = 0x01;
const BIT_ERC721_PER_TOKEN_CLEAR = 0x02;
const BIT_SET_APPROVAL_FOR_ALL_REVOKE = 0x04;
const BIT_PERMIT2_APPROVE_ZERO = 0x08;
const BIT_PERMIT2_LOCKDOWN = 0x10;
const BIT_PERMIT2_INVALIDATE_NONCES = 0x20;

const ALLOWED_APPROVAL_REVOCATION_MAX_MASK =
  BIT_ERC20_APPROVE_ZERO |
  BIT_ERC721_PER_TOKEN_CLEAR |
  BIT_SET_APPROVAL_FOR_ALL_REVOKE |
  BIT_PERMIT2_APPROVE_ZERO |
  BIT_PERMIT2_LOCKDOWN |
  BIT_PERMIT2_INVALIDATE_NONCES;

const NO_FLAGS_SET_ERROR =
  'Invalid ApprovalRevocation terms: at least one revocation primitive must be enabled';

/**
 * Human-readable selection of which revocation primitives the caveat allows.
 * Encode with {@link createApprovalRevocationTerms}; decode with {@link decodeApprovalRevocationTerms}.
 */
export type ApprovalRevocationTerms = {
  /** Allow revoking ERC-20 allowances via `approve(spender, 0)`. */
  erc20Approve: boolean;
  /** Allow clearing ERC-721 per-token approval via `approve(address(0), tokenId)`. */
  erc721Approve: boolean;
  /** Allow revoking operator access via `setApprovalForAll(operator, false)` (ERC-721 / ERC-1155). */
  erc721SetApprovalForAll: boolean;
  /** Allow revoking Permit2 approvals via `approve(token, spender, 0, 0)`. */
  permit2Approve: boolean;
  /** Allow revoking Permit2 lockdown via `lockdown((address,address)[])`. */
  permit2Lockdown: boolean;
  /** Allow revoking Permit2 invalidateNonces via `invalidateNonces(token, spender, newNonce)`. */
  permit2InvalidateNonces: boolean;
};

/**
 * Maps {@link ApprovalRevocationTerms} to the single-byte bitmask on the wire.
 *
 * @param terms - Selected Revocation primitives.
 * @returns Integer mask in specifying the allowed revocation primitives.
 * @throws Error if no flags are set.
 */
function termsToMask(terms: ApprovalRevocationTerms): number {
  let mask = 0;
  if (terms.erc20Approve) {
    mask |= BIT_ERC20_APPROVE_ZERO;
  }
  if (terms.erc721Approve) {
    mask |= BIT_ERC721_PER_TOKEN_CLEAR;
  }
  if (terms.erc721SetApprovalForAll) {
    mask |= BIT_SET_APPROVAL_FOR_ALL_REVOKE;
  }
  if (terms.permit2Approve) {
    mask |= BIT_PERMIT2_APPROVE_ZERO;
  }
  if (terms.permit2Lockdown) {
    mask |= BIT_PERMIT2_LOCKDOWN;
  }
  if (terms.permit2InvalidateNonces) {
    mask |= BIT_PERMIT2_INVALIDATE_NONCES;
  }
  if (mask === 0) {
    throw new Error(NO_FLAGS_SET_ERROR);
  }
  return mask;
}

/**
 * Parses a validated 1..63 bitmask into {@link ApprovalRevocationTerms}.
 *
 * @param mask - Integer byte value; only bits 0-5 may be set, and at least one must be set.
 * @returns Flag object for encoding/decoding.
 * @throws Error if reserved bits are set or the mask is zero.
 */
function maskToTerms(mask: number): ApprovalRevocationTerms {
  if (mask > ALLOWED_APPROVAL_REVOCATION_MAX_MASK) {
    throw new Error(
      'Invalid ApprovalRevocation terms: reserved bits must be zero (only bits 0-5 are defined)',
    );
  }

  if (mask === 0) {
    throw new Error(NO_FLAGS_SET_ERROR);
  }

  return {
    erc20Approve: (mask & BIT_ERC20_APPROVE_ZERO) !== 0,
    erc721Approve: (mask & BIT_ERC721_PER_TOKEN_CLEAR) !== 0,
    erc721SetApprovalForAll: (mask & BIT_SET_APPROVAL_FOR_ALL_REVOKE) !== 0,
    permit2Approve: (mask & BIT_PERMIT2_APPROVE_ZERO) !== 0,
    permit2Lockdown: (mask & BIT_PERMIT2_LOCKDOWN) !== 0,
    permit2InvalidateNonces: (mask & BIT_PERMIT2_INVALIDATE_NONCES) !== 0,
  };
}

/**
 * Creates terms for an ApprovalRevocation caveat.
 *
 * @param terms - Which Revocation primitives are permitted. At least one flag must be `true`.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms (one byte).
 * @throws Error if no Revocation primitive is enabled.
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
 * Creates terms for an ApprovalRevocation caveat.
 *
 * @param terms - Which Revocation primitives are permitted. At least one flag must be `true`.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms (one byte).
 * @throws Error if no Revocation primitive is enabled.
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
