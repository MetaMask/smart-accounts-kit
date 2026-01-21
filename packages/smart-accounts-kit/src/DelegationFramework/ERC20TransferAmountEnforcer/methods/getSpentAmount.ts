import { ERC20TransferAmountEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetSpentAmountParameters = {
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
}: ReadGetSpentAmountParameters): Promise<bigint> => {
  const amount = await readContract(client, {
    address: contractAddress,
    abi: ERC20TransferAmountEnforcer,
    functionName: 'spentMap',
    args: [delegationManager, delegationHash],
  });

  return amount;
};
