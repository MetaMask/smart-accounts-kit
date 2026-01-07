import { encode, encodeSingle, decodeSingle } from '@metamask/abi-utils';
import { hexToBytes, type BytesLike } from '@metamask/utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';

import {
  bytesLikeToBytes,
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from './returns';
import type { CaveatStruct, DelegationStruct, Hex } from './types';

/**
 * When designated as the delegate address in a delegation, this allows any beneficiary to redeem the delegation.
 */
export const ANY_BENEFICIARY = '0x0000000000000000000000000000000000000a11';

/**
 * To be used on a delegation as the root authority.
 */
export const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * The typehash for a delegation, used when generating a delegation hash.
 *
 * keccak('Delegation(address delegate,address delegator,bytes32 authority,Caveat[] caveats,uint256 salt)Caveat(address enforcer,bytes terms)')
 */
export const DELEGATION_TYPEHASH =
  '0x88c1d2ecf185adf710588203a5f263f0ff61be0d33da39792cde19ba9aa4331e';

/**
 * The typehash for a caveat, used when generating a caveat hash.
 *
 * keccak('Caveat(address enforcer,bytes terms)')
 */
export const CAVEAT_TYPEHASH =
  '0x80ad7e1b04ee6d994a125f4714ca0720908bd80ed16063ec8aee4b88e9253e2d';

/**
 * The ABI types for an array of delegations.
 */
const DELEGATION_ARRAY_ABI_TYPES =
  '(address,address,bytes32,(address,bytes,bytes)[],uint256,bytes)[]' as const;

/**
 * Encodes an array of delegations into a permission context.
 *
 * @param delegations - The delegations to encode.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The encoded delegations as a hex string (default) or Uint8Array.
 */
export function encodeDelegations(
  delegations: DelegationStruct[],
  options?: EncodingOptions<'hex'>,
): Hex;
export function encodeDelegations(
  delegations: DelegationStruct[],
  options: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Encodes an array of delegations into a permission context.
 *
 * @param delegations - The delegations to encode.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The encoded delegations as a hex string (default) or Uint8Array.
 */
export function encodeDelegations(
  delegations: DelegationStruct[],
  options: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  let result: Uint8Array;

  if (delegations.length === 0) {
    // short circuit for empty delegations, derived from
    // `encode(['(address,address,bytes32,(address,bytes,bytes)[],uint256,bytes)[]'],[[]],);`
    result = new Uint8Array(64);
    result[31] = 0x20;
  } else {
    const encodableStructs = delegations.map((struct) => [
      struct.delegate,
      struct.delegator,
      struct.authority,
      struct.caveats.map((caveat) => [
        caveat.enforcer,
        caveat.terms,
        caveat.args,
      ]),
      struct.salt,
      struct.signature,
    ]);

    result = encodeSingle(DELEGATION_ARRAY_ABI_TYPES, encodableStructs);
  }

  return prepareResult(result, options);
}

/**
 * Converts a decoded delegation struct to a delegation object using the provided conversion function.
 *
 * @param decodedDelegation - The decoded delegation struct as a tuple.
 * @param convertFn - Function to convert BytesLike values to the desired output type.
 * @returns A delegation object with all bytes-like values converted using the provided function.
 */
const delegationFromDecodedDelegation = <TEncoding extends BytesLike>(
  decodedDelegation: DecodedDelegation,
  convertFn: (value: BytesLike) => TEncoding,
): DelegationStruct<TEncoding> => {
  const [delegate, delegator, authority, caveats, salt, signature] =
    decodedDelegation;

  return {
    delegate: convertFn(delegate),
    delegator: convertFn(delegator),
    authority: convertFn(authority),
    caveats: caveats.map(([enforcer, terms, args]) => ({
      enforcer: convertFn(enforcer),
      terms: convertFn(terms),
      args: convertFn(args),
    })),
    salt,
    signature: convertFn(signature),
  };
};

/**
 * Represents a decoded delegation as a tuple structure.
 * This type defines the structure of a delegation after it has been decoded from
 * an encoded format.
 */
type DecodedDelegation = [
  BytesLike,
  BytesLike,
  BytesLike,
  [BytesLike, BytesLike, BytesLike][],
  bigint,
  BytesLike,
];

/**
 * Decodes an encoded permission context back into an array of delegations.
 *
 * @param encoded - The encoded delegations as a hex string or Uint8Array.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The decoded delegations array with types resolved based on options.
 */
export function decodeDelegations(
  encoded: BytesLike,
  options?: EncodingOptions<'hex'>,
): DelegationStruct<Hex>[];
export function decodeDelegations(
  encoded: BytesLike,
  options: EncodingOptions<'bytes'>,
): DelegationStruct<Uint8Array>[];
/**
 * Decodes an encoded permission context back into an array of delegations.
 *
 * @param encoded - The encoded delegations as a hex string or Uint8Array.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The decoded delegations array with types resolved based on options.
 */
export function decodeDelegations(
  encoded: BytesLike,
  options: EncodingOptions<ResultValue> = defaultOptions,
): DelegationStruct<Hex>[] | DelegationStruct<Uint8Array>[] {
  // it's possible to short circuit for empty delegations, but due to the
  // complexity of the input type, and the relative infrequency of empty delegations,
  // it's not worthwhile.

  const decodedStructs = decodeSingle(
    DELEGATION_ARRAY_ABI_TYPES,
    encoded,
    // return types cannot be inferred from complex ABI types, so we must assert the type
  ) as DecodedDelegation[];

  if (options.out === 'bytes') {
    return decodedStructs.map((struct) =>
      delegationFromDecodedDelegation(struct, bytesLikeToBytes),
    );
  }
  return decodedStructs.map((struct) =>
    delegationFromDecodedDelegation(struct, bytesLikeToHex),
  );
}

/**
 * Calculates the hash of a delegation for signing purposes.
 * The hash is computed by encoding the delegation parameters with the delegation typehash
 * and then applying keccak256 hashing.
 *
 * @param delegation - The delegation to hash.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The keccak256 hash of the encoded delegation as a hex string (default) or Uint8Array.
 */
export function hashDelegation(
  delegation: DelegationStruct,
  options?: EncodingOptions<'hex'>,
): Hex;
export function hashDelegation(
  delegation: DelegationStruct,
  options: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Calculates the hash of a delegation for signing purposes.
 * The hash is computed by encoding the delegation parameters with the delegation typehash
 * and then applying keccak256 hashing.
 *
 * @param delegation - The delegation to hash.
 * @param options - Encoding options. Defaults to { out: 'hex' }.
 * @returns The keccak256 hash of the encoded delegation as a hex string (default) or Uint8Array.
 */
export function hashDelegation(
  delegation: DelegationStruct,
  options: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const encoded = encode(
    ['bytes32', 'address', 'address', 'bytes32', 'bytes32', 'uint256'],
    [
      DELEGATION_TYPEHASH,
      delegation.delegate,
      delegation.delegator,
      delegation.authority,
      getCaveatsArrayHash(delegation.caveats),
      delegation.salt,
    ],
  );
  const hash = keccak256(encoded);
  return prepareResult(hash, options);
}

/**
 * Calculates the hash of an array of caveats. The caveats are individually abi
 * encoded and hashed, and concatenated. The resulting byte array is then
 * hashed to produce the CaveatsArrayHash.
 *
 * @param caveats - The array of caveats to hash.
 * @returns The keccak256 hash of the encoded caveat array.
 */
function getCaveatsArrayHash(caveats: CaveatStruct[]): Uint8Array {
  const byteLength = 32 * caveats.length;
  const encoded = new Uint8Array(byteLength);

  for (let i = 0; i < caveats.length; i++) {
    const caveat = caveats[i];
    if (!caveat) {
      throw new Error(`Caveat was undefined at index ${i}`);
    }
    const caveatHash = getCaveatHash(caveat);
    encoded.set(caveatHash, i * 32);
  }

  return keccak256(encoded);
}

/**
 * Calculates the hash of a single caveat.
 *
 * @param caveat - The caveat to hash.
 * @returns The keccak256 hash of the encoded caveat.
 */
function getCaveatHash(caveat: CaveatStruct): Uint8Array {
  const termsBytes =
    typeof caveat.terms === 'string' ? hexToBytes(caveat.terms) : caveat.terms;

  const termsHash = keccak256(termsBytes);

  const encoded = encode(
    ['bytes32', 'address', 'bytes32'],
    [CAVEAT_TYPEHASH, caveat.enforcer, termsHash],
  );
  const hash = keccak256(encoded);
  return hash;
}
