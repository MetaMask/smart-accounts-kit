import { Ownable2Step } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetOwnerParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetOwnerParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: Ownable2Step,
    functionName: 'owner',
  });
