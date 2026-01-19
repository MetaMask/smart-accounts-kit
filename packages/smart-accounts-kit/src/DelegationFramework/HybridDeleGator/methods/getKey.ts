import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetKeyParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
  keyId: string;
};

export const read = async ({
  client,
  hybridDeleGatorAddress,
  keyId,
}: ReadGetKeyParameters) =>
  await readContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'getKey',
    args: [keyId],
  });
