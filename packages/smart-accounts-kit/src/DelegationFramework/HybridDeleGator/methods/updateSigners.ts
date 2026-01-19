import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { P256Owner, InitializedClient } from '../../types';

export type EncodeUpdateSignersParameters = {
  eoaOwner: Address;
  p256Owners: P256Owner[];
};

export type SimulateUpdateSignersParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
} & EncodeUpdateSignersParameters;

export type ExecuteUpdateSignersParameters = {
  client: InitializedClient;
  hybridDeleGatorAddress: Address;
} & EncodeUpdateSignersParameters;

export const simulate = async ({
  client,
  hybridDeleGatorAddress,
  eoaOwner,
  p256Owners,
}: SimulateUpdateSignersParameters) => {
  return simulateContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'updateSigners',
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
}: ExecuteUpdateSignersParameters) => {
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
}: EncodeUpdateSignersParameters) => {
  return encodeFunctionData({
    abi: HybridDeleGator,
    functionName: 'updateSigners',
    args: [
      eoaOwner,
      p256Owners.map((p256Owner) => p256Owner.keyId),
      p256Owners.map((p256Owner) => p256Owner.x),
      p256Owners.map((p256Owner) => p256Owner.y),
    ],
  });
};
