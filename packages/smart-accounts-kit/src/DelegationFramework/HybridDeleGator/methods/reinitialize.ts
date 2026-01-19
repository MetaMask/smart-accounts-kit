import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { P256Owner, InitializedClient } from '../../types';

export type EncodeReinitializeParameters = {
  version: number;
  eoaOwner: Address;
  p256Owners: P256Owner[];
  removeExistingP256Owners: boolean;
};

export type SimulateReinitializeParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
} & EncodeReinitializeParameters;

export type ExecuteReinitializeParameters = {
  client: InitializedClient;
  hybridDeleGatorAddress: Address;
} & EncodeReinitializeParameters;

export const simulate = async ({
  client,
  hybridDeleGatorAddress,
  version,
  eoaOwner,
  p256Owners,
  removeExistingP256Owners,
}: SimulateReinitializeParameters) => {
  return simulateContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'reinitialize',
    args: [
      version,
      eoaOwner,
      p256Owners.map((p256Owner) => p256Owner.keyId),
      p256Owners.map((p256Owner) => p256Owner.x),
      p256Owners.map((p256Owner) => p256Owner.y),
      removeExistingP256Owners,
    ],
  });
};

export const execute = async ({
  client,
  hybridDeleGatorAddress,
  version,
  eoaOwner,
  p256Owners,
  removeExistingP256Owners,
}: ExecuteReinitializeParameters) => {
  const { request } = await simulate({
    client,
    hybridDeleGatorAddress,
    version,
    eoaOwner,
    p256Owners,
    removeExistingP256Owners,
  });

  return writeContract(client, request);
};

export const encode = ({
  version,
  eoaOwner,
  p256Owners,
  removeExistingP256Owners,
}: EncodeReinitializeParameters) => {
  return encodeFunctionData({
    abi: HybridDeleGator,
    functionName: 'reinitialize',
    args: [
      version,
      eoaOwner,
      p256Owners.map((p256Owner) => p256Owner.keyId),
      p256Owners.map((p256Owner) => p256Owner.x),
      p256Owners.map((p256Owner) => p256Owner.y),
      removeExistingP256Owners,
    ],
  });
};
