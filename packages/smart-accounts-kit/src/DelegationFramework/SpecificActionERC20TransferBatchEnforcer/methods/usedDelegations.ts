import { SpecificActionERC20TransferBatchEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadUsedDelegationsParameters = {
  client: Client;
  contractAddress: Address;
  delegationManager: Address;
  delegationHash: Hex;
};

export const read = async ({
  client,
  contractAddress,
  delegationManager,
  delegationHash,
}: ReadUsedDelegationsParameters): Promise<boolean> => {
  const isUsed = await readContract(client, {
    address: contractAddress,
    abi: SpecificActionERC20TransferBatchEnforcer,
    functionName: 'usedDelegations',
    args: [delegationManager, delegationHash],
  });

  return isUsed;
};
