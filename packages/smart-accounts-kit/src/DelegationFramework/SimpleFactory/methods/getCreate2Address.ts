import { SimpleFactory } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export const read = async (
  client: Client,
  factoryAddress: Address,
  creationCode: Hex,
  salt: Hex,
) => {
  return readContract(client, {
    address: factoryAddress,
    abi: SimpleFactory,
    functionName: 'computeAddress',
    args: [creationCode, salt],
  });
};
