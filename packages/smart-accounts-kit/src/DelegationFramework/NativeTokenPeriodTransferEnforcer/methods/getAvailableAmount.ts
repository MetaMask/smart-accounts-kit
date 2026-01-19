import { NativeTokenPeriodTransferEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetAvailableAmountParameters = {
  client: Client;
  contractAddress: Address;
  delegationHash: Hex;
  delegationManager: Address;
  terms: Hex;
};

export const read = async ({
  client,
  contractAddress,
  delegationHash,
  delegationManager,
  terms,
}: ReadGetAvailableAmountParameters) => {
  const [availableAmount, isNewPeriod, currentPeriod] = await readContract(
    client,
    {
      address: contractAddress,
      abi: NativeTokenPeriodTransferEnforcer,
      functionName: 'getAvailableAmount',
      args: [delegationHash, delegationManager, terms],
    },
  );

  return {
    availableAmount,
    isNewPeriod,
    currentPeriod,
  };
};
