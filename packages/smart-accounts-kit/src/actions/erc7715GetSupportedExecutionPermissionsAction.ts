import type { Client, Account, RpcSchema, Transport, Chain } from 'viem';

/**
 * Represents the supported execution permissions for a specific permission type.
 */
export type SupportedPermissionInfo = {
  chainIds: `0x${string}`[];
  ruleTypes: string[];
};

/**
 * Result type for the getSupportedExecutionPermissions action.
 * A record keyed by permission type containing supported chain IDs and rule types.
 */
export type GetSupportedExecutionPermissionsResult = Record<
  string,
  SupportedPermissionInfo
>;

/**
 * RPC schema for the wallet_getSupportedExecutionPermissions method.
 */
export type GetSupportedExecutionPermissionsSchema = RpcSchema &
  [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_getSupportedExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: [];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: GetSupportedExecutionPermissionsResult;
    },
  ];

/**
 * A Viem client extended with the getSupportedExecutionPermissions RPC method.
 */
export type GetSupportedExecutionPermissionsClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  GetSupportedExecutionPermissionsSchema
>;

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
  client: GetSupportedExecutionPermissionsClient,
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
