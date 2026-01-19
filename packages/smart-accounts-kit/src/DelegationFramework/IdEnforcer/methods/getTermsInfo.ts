import { IdEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetTermsInfoParameters = {
  client: Client;
  contractAddress: Address;
  terms: Hex;
};

export const read = async ({
  client,
  contractAddress,
  terms,
}: ReadGetTermsInfoParameters): Promise<bigint> => {
  const id = await readContract(client, {
    address: contractAddress,
    abi: IdEnforcer,
    functionName: 'getTermsInfo',
    args: [terms],
  });

  return id;
};
