import { ERC1967Proxy } from '@metamask/delegation-abis';
import { ERC1967Proxy as ERC1967ProxyBytecode } from '@metamask/delegation-abis/bytecode';
import type { Address, Client, Hex } from 'viem';
import { encodeDeployData } from 'viem';
import { getCode } from 'viem/actions';

import { getProxyImplementation } from './DeleGatorCore/read';

/**
 * Checks if a contract is deployed at the given address.
 *
 * @param options - The options for checking contract deployment.
 * @param options.client - The client to use for the query.
 * @param options.contractAddress - The address to check for contract deployment.
 * @returns A boolean indicating whether a contract is deployed at the address.
 * @description This function checks if there is actual bytecode at the provided contract address.
 */
export async function isContractDeployed({
  client,
  contractAddress,
}: {
  client: Client;
  contractAddress: Address;
}): Promise<boolean> {
  const code = await getCode(client, {
    address: contractAddress,
  });
  return Boolean(code) && code !== '0x';
}

/**
 * Checks if a proxy contract at the given address points to the expected implementation.
 *
 * @param options - The options for checking the implementation.
 * @param options.client - The client to use for the query.
 * @param options.contractAddress - The address of the proxy contract.
 * @param options.expectedImplementationAddress - The address that the implementation should match.
 * @returns A boolean indicating whether the implementation matches the expected one.
 * @description This function verifies both that the contract exists and that its implementation address matches.
 */
export async function isImplementationExpected({
  client,
  contractAddress,
  expectedImplementationAddress,
}: {
  client: Client;
  contractAddress: Address;
  expectedImplementationAddress: Address;
}): Promise<boolean> {
  if (!(await isContractDeployed({ client, contractAddress }))) {
    return false;
  }

  const implementationAddress = await getProxyImplementation({
    client,
    contractAddress,
  });

  return implementationAddress === expectedImplementationAddress;
}

/**
 * Encodes the "creation code" for an ERC1967Proxy contract that will be deployed via CREATE2 with the given implementation and initialization code.
 *
 * @param options - The options for encoding the proxy creation code.
 * @param options.implementationAddress - The address of the implementation contract for the proxy to use.
 * @param options.initcode - The calldata for the initialization function of the implementation contract.
 * @returns The encoded creation code for the proxy.
 * @description This function prepares the deployment bytecode for an ERC1967 proxy pointing to the given implementation.
 */
export const encodeProxyCreationCode = ({
  implementationAddress,
  initcode,
}: {
  implementationAddress: Address;
  initcode: Hex;
}): Hex =>
  encodeDeployData({
    abi: ERC1967Proxy,
    args: [implementationAddress, initcode],
    bytecode: ERC1967ProxyBytecode,
  });
