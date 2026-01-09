import type { Address, Hex } from 'viem';
import { concat } from 'viem';

const signatureTypes = ['ECDSA'] as const;

export type SignatureType = (typeof signatureTypes)[number];

/**
 * Represents a partial signature that can be aggregated with others.
 */
export type PartialSignature = {
  signer: Address;
  signature: Hex;
  type: SignatureType;
};

/**
 * Aggregates signatures into a single signature as expected by the MultiSig implementation.
 *
 * @param params - The parameters for signature aggregation.
 * @param params.signatures - The array of partial signatures to aggregate.
 * @returns The aggregated signature.
 */
export const aggregateSignature = ({
  signatures,
}: {
  signatures: PartialSignature[];
}): Hex => {
  if (signatures.length === 0) {
    return '0x';
  }

  for (const { type } of signatures) {
    if (!signatureTypes.includes(type)) {
      throw new Error(`Invalid signature type: ${type}`);
    }
  }

  // Sort signatures by signer address as required by MultiSig implementation
  const sortedSignatures = [...signatures].sort((a, b) =>
    a.signer.localeCompare(b.signer),
  );

  // Concatenate all signatures
  return concat(sortedSignatures.map(({ signature }) => signature));
};

/**
 * Type definition for the aggregateSignature function parameters.
 */
export type AggregateSignatureParams = {
  signatures: PartialSignature[];
};
