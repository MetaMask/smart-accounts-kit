import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetEntryPointParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetEntryPointParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'entryPoint',
  });
