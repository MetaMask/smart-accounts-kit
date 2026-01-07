import type { BytesLike } from '@metamask/utils';

export type { Hex } from '@metamask/utils';

/**
 * Represents a caveat that restricts or conditions a delegation.
 *
 * enforcer - The address of the contract that enforces this caveat's conditions.
 *
 * terms - The terms or conditions of the caveat encoded as hex data.
 *
 * args - Additional arguments required by the caveat enforcer, encoded as hex data.
 */
export type CaveatStruct<TBytes extends BytesLike = BytesLike> = {
  enforcer: TBytes;
  terms: TBytes;
  args: TBytes;
};

/**
 * Represents a delegation that grants permissions from a delegator to a delegate.
 *
 * delegate - The address of the entity receiving the delegation.
 *
 * delegator - The address of the entity granting the delegation.
 *
 * authority - The authority under which this delegation is granted. For root delegations, this is ROOT_AUTHORITY.
 *
 * caveats - An array of restrictions or conditions applied to this delegation.
 *
 * salt - A unique value to prevent replay attacks and ensure uniqueness of the delegation.
 *
 * signature - The cryptographic signature validating this delegation.
 */
export type DelegationStruct<TBytes extends BytesLike = BytesLike> = {
  delegate: TBytes;
  delegator: TBytes;
  authority: TBytes;
  caveats: CaveatStruct<TBytes>[];
  salt: bigint;
  signature: TBytes;
};
