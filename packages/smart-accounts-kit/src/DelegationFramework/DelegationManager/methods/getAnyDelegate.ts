import { DelegationManager } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetAnyDelegateParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetAnyDelegateParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DelegationManager,
    functionName: 'ANY_DELEGATE',
  });
