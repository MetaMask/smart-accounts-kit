import { ERC20TransferAmountEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract } from 'viem/actions';

export type ReadGetTermsInfoParameters = {
  client: Client;
  contractAddress: Address;
  terms: Hex;
};

export type TermsData = {
  allowedContract: Address;
  maxTokens: bigint;
};

export const read = async ({
  client,
  contractAddress,
  terms,
}: ReadGetTermsInfoParameters): Promise<TermsData> => {
  const [allowedContract, maxTokens] = await readContract(client, {
    address: contractAddress,
    abi: ERC20TransferAmountEnforcer,
    functionName: 'getTermsInfo',
    args: [terms],
  });

  return {
    allowedContract,
    maxTokens,
  };
};
