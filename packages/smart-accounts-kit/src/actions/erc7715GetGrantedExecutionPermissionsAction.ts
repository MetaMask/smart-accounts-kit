import type { PermissionTypes as RpcPermissionTypes } from '@metamask/7715-permission-types';
import { hexToNumber } from 'viem';

import type {
  GetGrantedExecutionPermissionsResult,
  MetaMaskExtensionClient,
  PermissionTypes,
  RpcGetGrantedExecutionPermissionsResult,
} from './erc7715Types';

export type { GetGrantedExecutionPermissionsResult } from './erc7715Types';

/**
 * Retrieves all previously granted execution permissions from the wallet according to EIP-7715 specification.
 *
 * @param client - The client to use for the request.
 * @returns A promise that resolves to an array of granted permission responses.
 * @description
 * This function queries the wallet for all granted permissions that are not yet revoked.
 * Each permission response includes the chain ID, address, signer, permission details,
 * context, and dependency information.
 * Chain IDs are converted from hex to numbers and token amounts from hex to bigint
 * for easier use in JavaScript/TypeScript.
 * @example
 * ```typescript
 * const grantedPermissions = await erc7715GetGrantedExecutionPermissionsAction(client);
 * // Returns an array of PermissionResponse objects with user-friendly types
 * ```
 */
export async function erc7715GetGrantedExecutionPermissionsAction(
  client: MetaMaskExtensionClient,
): Promise<GetGrantedExecutionPermissionsResult> {
  const result = await client.request(
    {
      method: 'wallet_getGrantedExecutionPermissions',
      params: [],
    },
    { retryCount: 0 },
  );

  if (!result) {
    throw new Error('Failed to get granted execution permissions');
  }

  return convertRpcPermissionResponsesToDeveloper(result);
}

/**
 * Converts RPC permission responses from hex to user-friendly types.
 * Converts chainId from hex to number, and token amounts from hex to bigint.
 *
 * @param result - The result from the RPC call with hex values.
 * @returns The converted result with user-friendly types.
 * @internal
 */
export function convertRpcPermissionResponsesToDeveloper(
  result: RpcGetGrantedExecutionPermissionsResult,
): GetGrantedExecutionPermissionsResult {
  return result.map((permission) => convertPermissionResponse(permission));
}

/**
 * Converts a single permission response to user-friendly types.
 *
 * @param permission - The permission response to convert.
 * @returns The converted permission response.
 */
function convertPermissionResponse(
  permission: RpcGetGrantedExecutionPermissionsResult[number],
): GetGrantedExecutionPermissionsResult[number] {
  const convertedPermission = {
    ...permission,
    chainId: hexToNumber(permission.chainId),
    permission: convertPermissionType(permission.permission),
  };

  return convertedPermission;
}

/**
 * Converts permission type data from hex to user-friendly types.
 *
 * @param permission - The permission object to convert.
 * @returns The converted permission object.
 */
function convertPermissionType(
  permission: RpcPermissionTypes,
): PermissionTypes {
  const convertedData: Record<string, unknown> = { ...permission.data };

  if ('amountPerSecond' in convertedData && convertedData.amountPerSecond) {
    convertedData.amountPerSecond = BigInt(
      convertedData.amountPerSecond as `0x${string}`,
    );
  }

  if ('periodAmount' in convertedData && convertedData.periodAmount) {
    convertedData.periodAmount = BigInt(
      convertedData.periodAmount as `0x${string}`,
    );
  }

  if ('initialAmount' in convertedData && convertedData.initialAmount) {
    convertedData.initialAmount = BigInt(
      convertedData.initialAmount as `0x${string}`,
    );
  }

  if ('maxAmount' in convertedData && convertedData.maxAmount) {
    convertedData.maxAmount = BigInt(convertedData.maxAmount as `0x${string}`);
  }

  return {
    ...permission,
    data: convertedData,
  } as PermissionTypes;
}
