import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetNonceParameters = {
  client: Client;
  contractAddress: Address;
  key?: bigint;
};

export const read = async ({
  client,
  contractAddress,
  key,
}: ReadGetNonceParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'getNonce',
    args: key ? [key] : undefined,
  });
