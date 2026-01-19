import { NonceEnforcer } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadCurrentNonceParameters = {
  client: Client;
  contractAddress: Address;
  delegationManager: Address;
  delegator: Address;
};

export const read = async ({
  client,
  contractAddress,
  delegationManager,
  delegator,
}: ReadCurrentNonceParameters): Promise<bigint> => {
  const nonce = await readContract(client, {
    address: contractAddress,
    abi: NonceEnforcer,
    functionName: 'currentNonce',
    args: [delegationManager, delegator],
  });

  return nonce;
};
