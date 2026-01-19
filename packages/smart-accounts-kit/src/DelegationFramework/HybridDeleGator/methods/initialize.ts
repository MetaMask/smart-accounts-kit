import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { P256Owner, InitializedClient } from '../../types';

export type EncodeInitializeParameters = {
  eoaOwner: Address;
  p256Owners: P256Owner[];
};

export type SimulateInitializeParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
} & EncodeInitializeParameters;

export type ExecuteInitializeParameters = {
  client: InitializedClient;
  hybridDeleGatorAddress: Address;
} & EncodeInitializeParameters;

export const simulate = async ({
  client,
  hybridDeleGatorAddress,
  eoaOwner,
  p256Owners,
}: SimulateInitializeParameters) => {
  return simulateContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'initialize',
    args: [
      eoaOwner,
      p256Owners.map((p256Owner) => p256Owner.keyId),
      p256Owners.map((p256Owner) => p256Owner.x),
      p256Owners.map((p256Owner) => p256Owner.y),
    ],
  });
};

export const execute = async ({
  client,
  hybridDeleGatorAddress,
  eoaOwner,
  p256Owners,
}: ExecuteInitializeParameters) => {
  const { request } = await simulate({
    client,
    hybridDeleGatorAddress,
    eoaOwner,
    p256Owners,
  });

  return writeContract(client, request);
};

export const encode = ({
  eoaOwner,
  p256Owners,
}: EncodeInitializeParameters) => {
  return encodeFunctionData({
    abi: HybridDeleGator,
    functionName: 'initialize',
    args: [
      eoaOwner,
      p256Owners.map((p256Owner) => p256Owner.keyId),
      p256Owners.map((p256Owner) => p256Owner.x),
      p256Owners.map((p256Owner) => p256Owner.y),
    ],
  });
};
