import { Pausable } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadIsPausedParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadIsPausedParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: Pausable,
    functionName: 'paused',
  });
