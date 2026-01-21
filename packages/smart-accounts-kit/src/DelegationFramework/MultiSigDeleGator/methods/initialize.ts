import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeInitializeParameters = {
  owners: Address[];
  threshold: bigint;
};

export type SimulateInitializeParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeInitializeParameters;

export type ExecuteInitializeParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeInitializeParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  owners,
  threshold,
}: SimulateInitializeParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'initialize',
    args: [owners, threshold],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  owners,
  threshold,
}: ExecuteInitializeParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    owners,
    threshold,
  });

  return writeContract(client, request);
};

export const encode = ({ owners, threshold }: EncodeInitializeParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'initialize',
    args: [owners, threshold],
  });
};
