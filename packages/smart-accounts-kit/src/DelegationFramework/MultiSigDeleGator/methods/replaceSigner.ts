import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type EncodeReplaceSignerParameters = {
  oldSigner: Address;
  newSigner: Address;
};

export type SimulateReplaceSignerParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
} & EncodeReplaceSignerParameters;

export type ExecuteReplaceSignerParameters = {
  client: InitializedClient;
  multiSigDeleGatorAddress: Address;
} & EncodeReplaceSignerParameters;

export const simulate = async ({
  client,
  multiSigDeleGatorAddress,
  oldSigner,
  newSigner,
}: SimulateReplaceSignerParameters) => {
  return simulateContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'replaceSigner',
    args: [oldSigner, newSigner],
  });
};

export const execute = async ({
  client,
  multiSigDeleGatorAddress,
  oldSigner,
  newSigner,
}: ExecuteReplaceSignerParameters) => {
  const { request } = await simulate({
    client,
    multiSigDeleGatorAddress,
    oldSigner,
    newSigner,
  });

  return writeContract(client, request);
};

export const encode = ({
  oldSigner,
  newSigner,
}: EncodeReplaceSignerParameters) => {
  return encodeFunctionData({
    abi: MultiSigDeleGator,
    functionName: 'replaceSigner',
    args: [oldSigner, newSigner],
  });
};
