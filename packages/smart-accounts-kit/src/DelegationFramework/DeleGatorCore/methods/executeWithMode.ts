import { DeleGatorCore } from '@metamask/delegation-abis';
import { encodeFunctionData } from 'viem';
import type { Address, Client } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import { encodeExecutionCalldata } from '../../../executions';
import type { ExecutionStruct, ExecutionMode } from '../../../executions';
import type { InitializedClient } from '../../types';

export type SimulateExecuteWithModeParameters = {
  client: Client;
  contractAddress: Address;
} & EncodeExecuteWithModeParameters;
export type EncodeExecuteWithModeParameters = {
  mode: ExecutionMode;
  executions: ExecutionStruct[];
};

export type ExecuteExecuteWithModeParameters = {
  client: InitializedClient;
  contractAddress: Address;
} & EncodeExecuteWithModeParameters;

export const simulate = async ({
  client,
  contractAddress,
  mode,
  executions,
}: SimulateExecuteWithModeParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: DeleGatorCore,
    functionName: 'execute',
    args: [mode, encodeExecutionCalldata(executions)],
  });
};

export const execute = async ({
  client,
  contractAddress,
  mode,
  executions,
}: ExecuteExecuteWithModeParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
    mode,
    executions,
  });

  return writeContract(client, request);
};

export const encode = ({
  mode,
  executions,
}: EncodeExecuteWithModeParameters) => {
  return encodeFunctionData({
    abi: DeleGatorCore,
    functionName: 'execute',
    args: [mode, encodeExecutionCalldata(executions)],
  });
};
