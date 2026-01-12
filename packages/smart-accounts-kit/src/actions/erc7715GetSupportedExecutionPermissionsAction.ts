import type {
  GetSupportedExecutionPermissionsResult,
  MetaMaskExtensionClient,
} from './erc7715Types';

export type {
  GetSupportedExecutionPermissionsResult,
  SupportedPermissionInfo,
} from './erc7715Types';

/**
 * Retrieves the supported execution permission types from the wallet according to EIP-7715 specification.
 *
 * @param client - The client to use for the request.
 * @returns A promise that resolves to a record of supported permission types with their chain IDs and rule types.
 * @description
 * This function queries the wallet for the permission types it supports.
 * The result is keyed by permission type and includes the supported chain IDs and rule types.
 * @example
 * ```typescript
 * const supported = await erc7715GetSupportedExecutionPermissionsAction(client);
 * // Returns:
 * // {
 * //   "native-token-allowance": {
 * //     "chainIds": ["0x1", "0x89"],
 * //     "ruleTypes": ["expiry"]
 * //   },
 * //   "erc20-token-allowance": {
 * //     "chainIds": ["0x1"],
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

  return result;
}
