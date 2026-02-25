import { permissionResponsesFromRpc } from './erc7715Mapping';
import type {
  GetGrantedExecutionPermissionsResult,
  MetaMaskExtensionClient,
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

  return permissionResponsesFromRpc(result);
}
