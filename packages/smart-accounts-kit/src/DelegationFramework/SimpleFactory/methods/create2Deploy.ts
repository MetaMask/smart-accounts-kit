import { SimpleFactory } from '@metamask/delegation-abis';
import type { Address, Hex, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { InitializedClient } from '../../types';

export type SimulateCreate2DeployParameters = {
  client: Client;
  factoryAddress: Address;
  creationCode: Hex;
  salt: Hex;
};

export type ExecuteCreate2DeployParameters = {
  client: InitializedClient;
  factoryAddress: Address;
  creationCode: Hex;
  salt: Hex;
};

export const simulate = async ({
  client,
  factoryAddress,
  creationCode,
  salt,
}: SimulateCreate2DeployParameters) => {
  return simulateContract(client, {
    address: factoryAddress,
    abi: SimpleFactory,
    functionName: 'deploy',
    args: [creationCode, salt],
  });
};

export const encode = (creationCode: Hex, salt: Hex) => {
  return encodeFunctionData({
    abi: SimpleFactory,
    functionName: 'deploy',
    args: [creationCode, salt],
  });
};

export const execute = async ({
  client,
  factoryAddress,
  creationCode,
  salt,
}: ExecuteCreate2DeployParameters) => {
  const { request } = await simulate({
    client,
    factoryAddress,
    creationCode,
    salt,
  });
  return writeContract(client, request);
};
