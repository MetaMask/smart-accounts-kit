import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetThresholdParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
};

export const read = async ({
  client,
  multiSigDeleGatorAddress,
}: ReadGetThresholdParameters) =>
  await readContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'getThreshold',
  });
