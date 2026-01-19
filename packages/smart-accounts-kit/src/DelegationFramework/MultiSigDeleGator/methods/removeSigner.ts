import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeRemoveSignerParameters = {
  signer: Address;
};

export type SimulateRemoveSignerParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeRemoveSignerParameters;

export type ExecuteRemoveSignerParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeRemoveSignerParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  signer,
}: SimulateRemoveSignerParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'removeSigner',
    args: [signer],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  signer,
}: ExecuteRemoveSignerParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    signer,
  });

  return writeContract(client, request);
};

export const encode = ({ signer }: EncodeRemoveSignerParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'removeSigner',
    args: [signer],
  });
};
