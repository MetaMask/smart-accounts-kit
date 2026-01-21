import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Hex, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { readContract } from 'viem/actions';

export type IsValidSignatureParameters = {
  client: Client;
  contractAddress: Address;
  hash: Hex;
  signature: Hex;
};

export type EncodeIsValidSignatureParameters = {
  hash: Hex;
  signature: Hex;
};

export const read = async ({
  client,
  contractAddress,
  hash,
  signature,
}: IsValidSignatureParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'isValidSignature',
    args: [hash, signature],
  });

export const encode = ({
  hash,
  signature,
}: EncodeIsValidSignatureParameters) => {
  return encodeFunctionData({
    abi: DeleGatorCore,
    functionName: 'isValidSignature',
    args: [hash, signature],
  });
};
