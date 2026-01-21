import { Ownable2Step } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type SimulateRenounceOwnershipParameters = {
  client: Client;
  contractAddress: Address;
};

export type ExecuteRenounceOwnershipParameters = {
  client: InitializedClient;
  contractAddress: Address;
};

export const simulate = async ({
  client,
  contractAddress,
}: SimulateRenounceOwnershipParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: Ownable2Step,
    functionName: 'renounceOwnership',
  });
};

export const execute = async ({
  client,
  contractAddress,
}: ExecuteRenounceOwnershipParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
  });
  return writeContract(client, request);
};

export const encode = () => {
  return encodeFunctionData({
    abi: Ownable2Step,
    functionName: 'renounceOwnership',
  });
};
