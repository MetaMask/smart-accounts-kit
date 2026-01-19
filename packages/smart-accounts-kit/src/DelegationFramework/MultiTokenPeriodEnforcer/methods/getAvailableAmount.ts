import { MultiTokenPeriodEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetAvailableAmountParameters = {
  client: Client;
  contractAddress: Address;
  delegationHash: Hex;
  delegationManager: Address;
  terms: Hex;
  args: Hex;
};

export const read = async ({
  client,
  contractAddress,
  delegationHash,
  delegationManager,
  terms,
  args,
}: ReadGetAvailableAmountParameters) => {
  const [availableAmount, isNewPeriod, currentPeriod] = await readContract(
    client,
    {
      address: contractAddress,
      abi: MultiTokenPeriodEnforcer,
      functionName: 'getAvailableAmount',
      args: [delegationHash, delegationManager, terms, args],
    },
  );

  return {
    availableAmount,
    isNewPeriod,
    currentPeriod,
  };
};
