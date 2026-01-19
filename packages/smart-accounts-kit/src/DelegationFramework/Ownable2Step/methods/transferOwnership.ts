import { Ownable2Step } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type SimulateTransferOwnershipParameters = {
  client: Client;
  contractAddress: Address;
  account: Address;
};

export type ExecuteTransferOwnershipParameters = {
  client: InitializedClient;
  contractAddress: Address;
  account: Address;
};

export const simulate = async ({
  client,
  contractAddress,
  account,
}: SimulateTransferOwnershipParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: Ownable2Step,
    functionName: 'transferOwnership',
    args: [account],
  });
};

export const execute = async ({
  client,
  contractAddress,
  account,
}: ExecuteTransferOwnershipParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
    account,
  });
  return writeContract(client, request);
};

export const encode = (account: Address) => {
  return encodeFunctionData({
    abi: Ownable2Step,
    functionName: 'transferOwnership',
    args: [account],
  });
};
