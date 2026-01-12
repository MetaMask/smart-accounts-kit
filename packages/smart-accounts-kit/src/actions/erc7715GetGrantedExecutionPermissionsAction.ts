import type {
  AccountSigner,
  PermissionResponse,
  PermissionTypes,
} from '@metamask/7715-permission-types';
import type { Client, Account, RpcSchema, Transport, Chain } from 'viem';

/**
 * Result type for the getGrantedExecutionPermissions action.
 * An array of permission responses representing all granted permissions that are not yet revoked.
 */
export type GetGrantedExecutionPermissionsResult = PermissionResponse<
  AccountSigner,
  PermissionTypes
>[];

/**
 * RPC schema for the wallet_getGrantedExecutionPermissions method.
 */
export type GetGrantedExecutionPermissionsSchema = RpcSchema &
  [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_getGrantedExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: [];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: GetGrantedExecutionPermissionsResult;
    },
  ];

/**
 * A Viem client extended with the getGrantedExecutionPermissions RPC method.
 */
export type GetGrantedExecutionPermissionsClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  GetGrantedExecutionPermissionsSchema
>;

/**
 * Retrieves all previously granted execution permissions from the wallet according to EIP-7715 specification.
 *
 * @param client - The client to use for the request.
 * @returns A promise that resolves to an array of granted permission responses.
 * @description
 * This function queries the wallet for all granted permissions that are not yet revoked.
 * Each permission response includes the chain ID, address, signer, permission details,
 * context, and dependency information.
 * @example
 * ```typescript
 * const grantedPermissions = await erc7715GetGrantedExecutionPermissionsAction(client);
 * // Returns an array of PermissionResponse objects
 * ```
 */
export async function erc7715GetGrantedExecutionPermissionsAction(
  client: GetGrantedExecutionPermissionsClient,
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

  return result;
}
