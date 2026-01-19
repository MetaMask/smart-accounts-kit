import { DelegationManager } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadDisabledDelegationsParameters = {
  client: Client;
  contractAddress: Address;
  delegationHash: Hex;
};

export const read = async ({
  client,
  contractAddress,
  delegationHash,
}: ReadDisabledDelegationsParameters) =>
  await readContract(client, {
    address: contractAddress,
    abi: DelegationManager,
    functionName: 'disabledDelegations',
    args: [delegationHash],
  });
