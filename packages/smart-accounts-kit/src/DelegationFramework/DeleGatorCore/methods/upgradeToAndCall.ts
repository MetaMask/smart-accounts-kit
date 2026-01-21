import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Hex, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type SimulateUpgradeToAndCallParameters = {
  client: Client;
  contractAddress: Address;
} & EncodeUpgradeToAndCallParameters;

export type EncodeUpgradeToAndCallParameters = {
  implementation: Address;
  data: Hex;
};

export type ExecuteUpgradeToAndCallParameters = {
  client: InitializedClient;
  contractAddress: Address;
} & EncodeUpgradeToAndCallParameters;

export const simulate = async ({
  client,
  contractAddress,
  implementation,
  data,
}: SimulateUpgradeToAndCallParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'upgradeToAndCall',
    args: [implementation, data],
  });
};

export const execute = async ({
  client,
  contractAddress,
  implementation,
  data,
}: ExecuteUpgradeToAndCallParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
    implementation,
    data,
  });

  return writeContract(client, request);
};

export const encode = ({
  implementation,
  data,
}: EncodeUpgradeToAndCallParameters) => {
  return encodeFunctionData({
    abi: DeleGatorCore,
    functionName: 'upgradeToAndCall',
    args: [implementation, data],
  });
};
