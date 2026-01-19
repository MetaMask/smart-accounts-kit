import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeAddSignerParameters = {
  signer: Address;
};

export type SimulateAddSignerParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeAddSignerParameters;

export type ExecuteAddSignerParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeAddSignerParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  signer,
}: SimulateAddSignerParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'addSigner',
    args: [signer],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  signer,
}: ExecuteAddSignerParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    signer,
  });

  return writeContract(client, request);
};

export const encode = ({ signer }: EncodeAddSignerParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'addSigner',
    args: [signer],
  });
};
