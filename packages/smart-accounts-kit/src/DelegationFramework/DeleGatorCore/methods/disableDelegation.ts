import { DeleGatorCore } from '@metamask/delegation-abis';
import { encodeFunctionData } from 'viem';
import type { Address, Client } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import { toDelegationStruct } from '../../../delegation';
import type { Delegation } from '../../../types';
import type { InitializedClient } from '../../types';

export type SimulateDisableDelegationParameters = {
  client: Client;
  delegationManagerAddress: Address;
  delegation: Delegation;
};

export type EncodeDisableDelegationParameters = {
  delegation: Delegation;
};

export type ExecuteDisableDelegationParameters = {
  client: InitializedClient;
  delegationManagerAddress: Address;
  delegation: Delegation;
};

export const simulate = async ({
  client,
  delegationManagerAddress,
  delegation,
}: SimulateDisableDelegationParameters) => {
  const delegationStruct = toDelegationStruct(delegation);

  return simulateContract(client, {
    address: delegationManagerAddress,
    abi: DeleGatorCore,
    functionName: 'disableDelegation',
    args: [delegationStruct],
  });
};

export const execute = async ({
  client,
  delegationManagerAddress,
  delegation,
}: ExecuteDisableDelegationParameters) => {
  const { request } = await simulate({
    client,
    delegationManagerAddress,
    delegation,
  });

  return writeContract(client, request);
};

export const encode = ({ delegation }: EncodeDisableDelegationParameters) => {
  const delegationStruct = toDelegationStruct(delegation);

  return encodeFunctionData({
    abi: DeleGatorCore,
    functionName: 'disableDelegation',
    args: [delegationStruct],
  });
};
