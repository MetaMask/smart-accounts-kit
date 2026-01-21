import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeUpdateMultiSigParametersParameters = {
  owners: Address[];
  threshold: bigint;
  removeExistingOwners: boolean;
};

export type SimulateUpdateMultiSigParametersParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeUpdateMultiSigParametersParameters;

export type ExecuteUpdateMultiSigParametersParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeUpdateMultiSigParametersParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  owners,
  threshold,
  removeExistingOwners,
}: SimulateUpdateMultiSigParametersParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'updateMultiSigParameters',
    args: [owners, threshold, removeExistingOwners],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  owners,
  threshold,
  removeExistingOwners,
}: ExecuteUpdateMultiSigParametersParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    owners,
    threshold,
    removeExistingOwners,
  });

  return writeContract(client, request);
};

export const encode = ({
  owners,
  threshold,
  removeExistingOwners,
}: EncodeUpdateMultiSigParametersParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'updateMultiSigParameters',
    args: [owners, threshold, removeExistingOwners],
  });
};
