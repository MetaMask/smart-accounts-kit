import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetMaxNumberOfSignersParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
};

export const read = async ({
  client,
  multiSigDeleGatorAddress,
}: ReadGetMaxNumberOfSignersParameters) =>
  await readContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'MAX_NUMBER_OF_SIGNERS',
  });
