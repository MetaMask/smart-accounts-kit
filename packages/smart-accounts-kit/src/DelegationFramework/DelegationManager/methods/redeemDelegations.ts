import { DelegationManager } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import { encodePermissionContexts } from '../../../delegation';
import { encodeExecutionCalldatas } from '../../../executions';
import type { ExecutionMode, ExecutionStruct } from '../../../executions';
import type { Delegation } from '../../../types';
import type { InitializedClient } from '../../types';

export type EncodeRedeemDelegationsParameters = {
  delegations: Delegation[][];
  modes: ExecutionMode[];
  executions: ExecutionStruct[][];
};

export type SimulateRedeemDelegationsParameters = {
  client: Client;
  delegationManagerAddress: Address;
} & EncodeRedeemDelegationsParameters;

export type ExecuteRedeemDelegationsParameters = {
  client: InitializedClient;
  delegationManagerAddress: Address;
} & EncodeRedeemDelegationsParameters;

export const simulate = async ({
  client,
  delegationManagerAddress,
  delegations,
  modes,
  executions,
}: SimulateRedeemDelegationsParameters) => {
  return simulateContract(client, {
    address: delegationManagerAddress,
    abi: DelegationManager,
    functionName: 'redeemDelegations',
    args: [
      encodePermissionContexts(delegations),
      modes,
      encodeExecutionCalldatas(executions),
    ],
  });
};

export const execute = async ({
  client,
  delegationManagerAddress,
  delegations,
  modes,
  executions,
}: ExecuteRedeemDelegationsParameters) => {
  const { request } = await simulate({
    client,
    delegationManagerAddress,
    delegations,
    modes,
    executions,
  });

  return writeContract(client, request);
};

export const encode = ({
  delegations,
  modes,
  executions,
}: EncodeRedeemDelegationsParameters) => {
  return encodeFunctionData({
    abi: DelegationManager,
    functionName: 'redeemDelegations',
    args: [
      encodePermissionContexts(delegations),
      modes,
      encodeExecutionCalldatas(executions),
    ],
  });
};
