import { DelegationManager } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

import { toDelegationStruct } from '../../../delegation';
import type { Delegation } from '../../../types';
import type { InitializedClient } from '../../types';
import type { NarrowAbiToFunction } from '../../utils';

export type EncodeDisableDelegationParameters = {
  delegation: Delegation;
};

export type SimulateDisableDelegationParameters = {
  client: Client;
  delegationManagerAddress: Address;
} & EncodeDisableDelegationParameters;

export type ExecuteDisableDelegationParameters = {
  client: InitializedClient;
  delegationManagerAddress: Address;
} & EncodeDisableDelegationParameters;

export const simulate = async ({
  client,
  delegationManagerAddress,
  delegation,
}: SimulateDisableDelegationParameters) => {
  const abi = DelegationManager as any as NarrowAbiToFunction<
    typeof DelegationManager,
    'disableDelegation'
  >;

  const delegationStruct = toDelegationStruct(delegation);

  return simulateContract(client, {
    address: delegationManagerAddress,
    abi,
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
    abi: DelegationManager,
    functionName: 'disableDelegation',
    args: [delegationStruct],
  });
};
