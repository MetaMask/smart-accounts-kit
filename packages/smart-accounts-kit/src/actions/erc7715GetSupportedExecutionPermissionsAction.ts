import { hexToNumber } from 'viem';

import type {
  GetSupportedExecutionPermissionsResult,
  MetaMaskExtensionClient,
  RpcGetSupportedExecutionPermissionsResult,
} from './erc7715Types';

export type { GetSupportedExecutionPermissionsResult } from './erc7715Types';

/**
 * Retrieves the supported execution permission types from the wallet according to EIP-7715 specification.
 *
 * @param client - The client to use for the request.
 * @returns A promise that resolves to a record of supported permission types with their chain IDs and rule types.
 * @description
 * This function queries the wallet for the permission types it supports.
 * The result is keyed by permission type and includes the supported chain IDs and rule types.
 * Chain IDs are converted from hex to numbers for easier use.
 * @example
 * ```typescript
 * const supported = await erc7715GetSupportedExecutionPermissionsAction(client);
 * // Returns:
 * // {
 * //   "native-token-allowance": {
 * //     "chainIds": [1, 137],
 * //     "ruleTypes": ["expiry"]
 * //   },
 * //   "erc20-token-allowance": {
 * //     "chainIds": [1],
 * //     "ruleTypes": []
 * //   }
 * // }
 * ```
 */
export async function erc7715GetSupportedExecutionPermissionsAction(
  client: MetaMaskExtensionClient,
): Promise<GetSupportedExecutionPermissionsResult> {
  const result = await client.request(
    {
      method: 'wallet_getSupportedExecutionPermissions',
      params: [],
    },
    { retryCount: 0 },
  );

  if (!result) {
    throw new Error('Failed to get supported execution permissions');
  }

  return convertSupportedPermissionsResult(result);
}

/**
 * Converts the RPC response from hex chain IDs to numbers.
 *
 * @param result - The result from the RPC call with hex chain IDs.
 * @returns The converted result with numeric chain IDs.
 */
function convertSupportedPermissionsResult(
  result: RpcGetSupportedExecutionPermissionsResult,
): GetSupportedExecutionPermissionsResult {
  const converted: GetSupportedExecutionPermissionsResult = {};

  for (const [permissionType, permissionInfo] of Object.entries(result)) {
    converted[permissionType] = {
      chainIds: permissionInfo.chainIds.map((chainId) => hexToNumber(chainId)),
      ruleTypes: permissionInfo.ruleTypes,
    };
  }

  return converted;
}
