import type { Client, Address, Hex } from 'viem';
import { isAddressEqual } from 'viem';
import { getCode } from 'viem/actions';

import type { SmartAccountsEnvironment } from '../types';

// EIP-7702 delegation prefix (0xef0100)
const DELEGATION_PREFIX = '0xef0100' as const;

/**
 * Parameters for checking if an account is delegated to the EIP-7702 implementation.
 */
export type IsValid7702ImplementationParameters = {
  /** The client to use for the query. */
  client: Client;
  /** The address to check for proper delegation. */
  accountAddress: Address;
  /** The SmartAccountsEnvironment containing contract addresses. */
  environment: SmartAccountsEnvironment;
};

/**
 * Extracts the delegated contract address from EIP-7702 delegation code.
 *
 * @param code - The code returned from getCode for a delegated account.
 * @returns The delegated contract address or null if not a valid delegation.
 */
function extractDelegatedAddress(code: Hex | undefined): Address | null {
  if (code?.length !== 48) {
    // 0x (2 chars) + ef0100 (6 chars) + address (40 chars) = 48 chars
    return null;
  }

  if (!code.toLowerCase().startsWith(DELEGATION_PREFIX.toLowerCase())) {
    return null;
  }

  // Extract the 20-byte address after the delegation prefix
  const addressHex = code.slice(8); // Remove '0xef0100' prefix (8 chars)
  return `0x${addressHex}`;
}

/**
 * Checks if an account is properly delegated to the EIP-7702 implementation.
 *
 * This function validates EIP-7702 delegations by checking if the EOA has a 7702
 * contract assigned to it and comparing the delegated address against the 7702
 * implementation found in the environment.
 *
 * @param params - The parameters for checking the delegation.
 * @param params.client - The client to use for the query.
 * @param params.accountAddress - The address to check for proper delegation.
 * @param params.environment - The SmartAccountsEnvironment containing contract addresses.
 * @returns A promise that resolves to true if the account is properly delegated to the 7702 implementation, false otherwise.
 * @example
 * ```typescript
 * const isValid = await isValid7702Implementation({
 *   client: publicClient,
 *   accountAddress: '0x...',
 *   environment: smartAccountEnvironment,
 * });
 *
 * if (isValid) {
 *   console.log('Account is properly delegated to EIP-7702 implementation');
 * } else {
 *   console.log('Account is not properly delegated');
 * }
 * ```
 */
export async function isValid7702Implementation({
  client,
  accountAddress,
  environment,
}: IsValid7702ImplementationParameters): Promise<boolean> {
  try {
    // Get the code at the account address
    const code = await getCode(client, {
      address: accountAddress,
    });

    // Extract the delegated contract address from the EIP-7702 delegation code
    const delegatedAddress = extractDelegatedAddress(code);

    // If no valid delegation found, return false
    if (!delegatedAddress) {
      return false;
    }

    // Compare the delegated address with the 7702 implementation in the environment
    const expectedImplementation =
      environment.implementations.EIP7702StatelessDeleGatorImpl;
    if (!expectedImplementation) {
      return false;
    }

    return isAddressEqual(delegatedAddress, expectedImplementation);
  } catch {
    // If the call fails (e.g., no code at address, network error),
    // then it's not properly delegated to our implementation
    return false;
  }
}
