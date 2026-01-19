import { Ownable2Step } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type SimulateAcceptOwnershipParameters = {
  client: Client;
  contractAddress: Address;
};

export type ExecuteAcceptOwnershipParameters = {
  client: InitializedClient;
  contractAddress: Address;
};

export const simulate = async ({
  client,
  contractAddress,
}: SimulateAcceptOwnershipParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: Ownable2Step,
    functionName: 'acceptOwnership',
  });
};

export const execute = async ({
  client,
  contractAddress,
}: ExecuteAcceptOwnershipParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
  });
  return writeContract(client, request);
};

export const encode = () => {
  return encodeFunctionData({
    abi: Ownable2Step,
    functionName: 'acceptOwnership',
  });
};
