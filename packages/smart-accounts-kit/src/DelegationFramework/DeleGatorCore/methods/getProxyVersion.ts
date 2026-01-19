import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetProxyVersionParameters = {
  client: Client;
  contractAddress: Address;
};

export const read = async ({
  client,
  contractAddress,
}: ReadGetProxyVersionParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'getInitializedVersion',
  });
