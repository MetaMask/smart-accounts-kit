import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetKeyIdHashesParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
};

export const read = async ({
  client,
  hybridDeleGatorAddress,
}: ReadGetKeyIdHashesParameters) =>
  await readContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'getKeyIdHashes',
  });
