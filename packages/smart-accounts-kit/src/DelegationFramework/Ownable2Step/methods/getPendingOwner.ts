import { Ownable2Step } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetPendingOwnerParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetPendingOwnerParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: Ownable2Step,
    functionName: 'pendingOwner',
  });
