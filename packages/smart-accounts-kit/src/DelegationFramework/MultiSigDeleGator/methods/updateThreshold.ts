import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeUpdateThresholdParameters = {
  threshold: bigint;
};

export type SimulateUpdateThresholdParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeUpdateThresholdParameters;

export type ExecuteUpdateThresholdParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeUpdateThresholdParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  threshold,
}: SimulateUpdateThresholdParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'updateThreshold',
    args: [threshold],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  threshold,
}: ExecuteUpdateThresholdParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    threshold,
  });

  return writeContract(client, request);
};

export const encode = ({ threshold }: EncodeUpdateThresholdParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'updateThreshold',
    args: [threshold],
  });
};
