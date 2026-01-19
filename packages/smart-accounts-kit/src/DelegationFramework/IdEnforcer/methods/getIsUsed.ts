import { IdEnforcer } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetIsUsedParameters = {
  client: Client;
  contractAddress: Address;
  delegationManager: Address;
  delegator: Address;
  id: bigint;
};

export const read = async ({
  client,
  contractAddress,
  delegationManager,
  delegator,
  id,
}: ReadGetIsUsedParameters): Promise<boolean> => {
  const isUsed = await readContract(client, {
    address: contractAddress,
    abi: IdEnforcer,
    functionName: 'getIsUsed',
    args: [delegationManager, delegator, id],
  });

  return isUsed;
};
