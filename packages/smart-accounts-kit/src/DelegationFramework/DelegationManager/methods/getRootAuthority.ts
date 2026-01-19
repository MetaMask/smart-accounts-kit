import { DelegationManager } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetRootAuthorityParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetRootAuthorityParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DelegationManager,
    functionName: 'ROOT_AUTHORITY',
  });
