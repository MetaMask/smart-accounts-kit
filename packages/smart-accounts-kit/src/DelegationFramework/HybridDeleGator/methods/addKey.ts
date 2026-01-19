import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { P256Owner, InitializedClient } from '../../types';

export type EncodeAddKeyParameters = {
  p256Owner: P256Owner;
};

export type SimulateAddKeyParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
} & EncodeAddKeyParameters;

export type ExecuteAddKeyParameters = {
  client: InitializedClient;
  hybridDeleGatorAddress: Address;
} & EncodeAddKeyParameters;

export const simulate = async ({
  client,
  hybridDeleGatorAddress,
  p256Owner,
}: SimulateAddKeyParameters) => {
  return simulateContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'addKey',
    args: [p256Owner.keyId, p256Owner.x, p256Owner.y],
  });
};

export const execute = async ({
  client,
  hybridDeleGatorAddress,
  p256Owner,
}: ExecuteAddKeyParameters) => {
  const { request } = await simulate({
    client,
    hybridDeleGatorAddress,
    p256Owner,
  });

  return writeContract(client, request);
};

export const encode = ({ p256Owner }: EncodeAddKeyParameters) => {
  return encodeFunctionData({
    abi: HybridDeleGator,
    functionName: 'addKey',
    args: [p256Owner.keyId, p256Owner.x, p256Owner.y],
  });
};
