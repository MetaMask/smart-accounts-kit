import { NonceEnforcer } from '@metamask/delegation-abis';
import type { Account, Address, Chain, Client, Transport } from 'viem';
import { encodeFunctionData } from 'viem';
import { simulateContract, writeContract } from 'viem/actions';

export type SimulateIncrementNonceParameters = {
  client: Client<Transport, Chain, Account>;
  contractAddress: Address;
  delegationManager: Address;
};

export const encode = (delegationManager: Address) => {
  return encodeFunctionData({
    abi: NonceEnforcer,
    functionName: 'incrementNonce',
    args: [delegationManager],
  });
};

export const simulate = async ({
  client,
  contractAddress,
  delegationManager,
}: SimulateIncrementNonceParameters) => {
  return simulateContract(client, {
    address: contractAddress,
    abi: NonceEnforcer,
    functionName: 'incrementNonce',
    args: [delegationManager],
  });
};

export const execute = async ({
  client,
  contractAddress,
  delegationManager,
}: SimulateIncrementNonceParameters) => {
  const { request } = await simulate({
    client,
    contractAddress,
    delegationManager,
  });
  return writeContract(client, request);
};
