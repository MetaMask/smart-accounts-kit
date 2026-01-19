import { HybridDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeRemoveKeyParameters = {
  keyId: string;
};

export type SimulateRemoveKeyParameters = {
  client: Client;
  hybridDeleGatorAddress: Address;
} & EncodeRemoveKeyParameters;

export type ExecuteRemoveKeyParameters = {
  client: InitializedClient;
  hybridDeleGatorAddress: Address;
} & EncodeRemoveKeyParameters;

export const simulate = async ({
  client,
  hybridDeleGatorAddress,
  keyId,
}: SimulateRemoveKeyParameters) => {
  return simulateContract(client, {
    address: hybridDeleGatorAddress,
    abi: HybridDeleGator,
    functionName: 'removeKey',
    args: [keyId],
  });
};

export const execute = async ({
  client,
  hybridDeleGatorAddress,
  keyId,
}: ExecuteRemoveKeyParameters) => {
  const { request } = await simulate({
    client,
    hybridDeleGatorAddress,
    keyId,
  });

  return writeContract(client, request);
};

export const encode = ({ keyId }: EncodeRemoveKeyParameters) => {
  return encodeFunctionData({
    abi: HybridDeleGator,
    functionName: 'removeKey',
    args: [keyId],
  });
};
