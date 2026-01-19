import { MultiSigDeleGator } from '@metamask/delegation-abis';
import type { Address, Client } from 'viem';
import { readContract } from 'viem/actions';

export type ReadIsSignerParameters = {
  client: Client;
  multiSigDeleGatorAddress: Address;
  signer: Address;
};

export const read = async ({
  client,
  multiSigDeleGatorAddress,
  signer,
}: ReadIsSignerParameters) =>
  await readContract(client, {
    address: multiSigDeleGatorAddress,
    abi: MultiSigDeleGator,
    functionName: 'isSigner',
    args: [signer],
  });
