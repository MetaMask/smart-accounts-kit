import {
  permissionRequestToRpc,
  permissionResponsesFromRpc,
} from './erc7715Mapping';
import type {
  GetGrantedExecutionPermissionsResult,
  MetaMaskExtensionClient,
  PermissionRequestParameter,
} from './erc7715Types';

export type {
  GetGrantedExecutionPermissionsResult,
  GetSupportedExecutionPermissionsResult,
  MetaMaskExtensionClient,
  MetaMaskExtensionSchema,
  SupportedPermissionInfo,
  PermissionTypes,
  PermissionRequestParameter,
} from './erc7715Types';

/**
 * Parameters for the RequestExecutionPermissions action.
 *
 * @template Signer - The type of the signer, either an Address or Account.
 */
export type RequestExecutionPermissionsParameters =
  PermissionRequestParameter[];

/**
 * Return type for the request execution permissions action.
 */
export type RequestExecutionPermissionsReturnType =
  GetGrantedExecutionPermissionsResult;

/**
 * Grants permissions according to EIP-7715 specification.
 *
 * @template Signer - The type of the signer, either an Address or Account.
 * @param client - The client to use for the request.
 * @param parameters - The permissions requests to grant.
 * @returns A promise that resolves to the permission responses.
 * @description
 * This function formats the permissions requests and invokes the wallet method to grant permissions.
 * It will throw an error if the permissions could not be granted.
 */
export async function erc7715RequestExecutionPermissionsAction(
  client: MetaMaskExtensionClient,
  parameters: RequestExecutionPermissionsParameters,
): Promise<RequestExecutionPermissionsReturnType> {
  const formattedPermissionRequest = parameters.map(permissionRequestToRpc);

  const result = await client.request(
    {
      method: 'wallet_requestExecutionPermissions',
      params: formattedPermissionRequest,
    },
    { retryCount: 0 },
  );

  if (!result) {
    throw new Error('Failed to grant permissions');
  }

  return permissionResponsesFromRpc(result);
}
