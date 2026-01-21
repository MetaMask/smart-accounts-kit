import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetKeyIdHashesCountParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
};

export const read = async ({
  client,
  hybridDeleGatorAddress,
}: ReadGetKeyIdHashesCountParameters) =>
  await readContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'getKeyIdHashesCount',
  });
