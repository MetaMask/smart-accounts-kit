import { DeleGatorCore } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import type { ExecutionStruct } from '../../../executions';
import type { InitializedClient } from '../../types';

export type SimulateExecuteParameters = {
  client: Client;
  contractAddress: Address;
  execution: ExecutionStruct;
};

export type EncodeExecuteParameters = {
  execution: ExecutionStruct;
};

export type ExecuteExecuteParameters = {
  client: InitializedClient;
  contractAddress: Address;
  execution: ExecutionStruct;
};

export const simulate = async ({
  client,
  contractAddress,
  execution,
}: SimulateExecuteParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'execute',
    args: [execution],
  });
};

export const execute = async ({
  client,
  contractAddress,
  execution,
}: ExecuteExecuteParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
    execution,
  });

  return writeContract(client, request);
};

export const encode = ({ execution }: EncodeExecuteParameters) => {
  return encodeFunctionData({
    abi: DeleGatorCore,
    functionName: 'execute',
    args: [execution],
  });
};
