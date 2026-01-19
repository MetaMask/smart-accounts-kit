import { SpecificActionERC20TransferBatchEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetTermsInfoParameters = {
  client: Client;
  contractAddress: Address;
  terms: Hex;
};

export type TermsData = {
  tokenAddress: Address;
  recipient: Address;
  amount: bigint;
  firstTarget: Address;
  firstCalldata: Hex;
};

export const read = async ({
  client,
  contractAddress,
  terms,
}: ReadGetTermsInfoParameters): Promise<TermsData> => {
  const termsData = await readContract(client, {
    address: contractAddress,
    abi: SpecificActionERC20TransferBatchEnforcer,
    functionName: 'getTermsInfo',
    args: [terms],
  });

  return termsData as TermsData;
};
