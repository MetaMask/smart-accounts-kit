import { EntryPoint } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetNonceParameters = {
  client: Client;
  entryPoint: Address;
  contractAddress: Address;
  key: bigint;
};

export const read = async ({
  client,
  entryPoint,
  contractAddress,
  key,
}: ReadGetNonceParameters) =>
  await readContract(client, {
    address: entryPoint,
    abi: EntryPoint,
    functionName: 'getNonce',
    args: [contractAddress, key],
  });
