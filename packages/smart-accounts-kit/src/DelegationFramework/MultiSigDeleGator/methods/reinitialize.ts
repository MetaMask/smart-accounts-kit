import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeReinitializeParameters = {
  version: bigint;
  owners: Address[];
  threshold: bigint;
  removeExistingOwners: boolean;
};

export type SimulateReinitializeParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeReinitializeParameters;

export type ExecuteReinitializeParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeReinitializeParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  version,
  owners,
  threshold,
  removeExistingOwners,
}: SimulateReinitializeParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'reinitialize',
    args: [version, owners, threshold, removeExistingOwners],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  version,
  owners,
  threshold,
  removeExistingOwners,
}: ExecuteReinitializeParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    version,
    owners,
    threshold,
    removeExistingOwners,
  });

  return writeContract(client, request);
};

export const encode = ({
  version,
  owners,
  threshold,
  removeExistingOwners,
}: EncodeReinitializeParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'reinitialize',
    args: [version, owners, threshold, removeExistingOwners],
  });
};
