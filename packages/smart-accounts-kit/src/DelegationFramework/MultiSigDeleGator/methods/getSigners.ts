import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetSignersParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
};

export const read = async ({
  client,
  multiSigDeleGatorAddress,
}: ReadGetSignersParameters) =>
  await readContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'getSigners',
  });
