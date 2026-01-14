import type {
  PermissionTypes,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permission-types';
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
 * Result type for the getGrantedExecutionPermissions action.
 * An array of permission responses representing all granted permissions that are not yet revoked.
 */
export type GetGrantedExecutionPermissionsResult = PermissionResponse<
  PermissionTypes
>[];

/**
 * RPC schema for ERC-7715 execution permission methods.
 *
 * Extends the base RPC schema with methods specific to interacting with EIP-7715:
 * - `wallet_requestExecutionPermissions`: Requests execution permissions from the wallet.
 * - `wallet_getSupportedExecutionPermissions`: Gets supported permission types.
 * - `wallet_getGrantedExecutionPermissions`: Gets all granted permissions.
 */
/* eslint-disable @typescript-eslint/naming-convention */
export type MetaMaskExtensionSchema = RpcSchema &
  [
    {
      Method: 'wallet_requestExecutionPermissions';
      Params: PermissionRequest<PermissionTypes>[];
      ReturnType: PermissionResponse<PermissionTypes>[];
    },
    {
      Method: 'wallet_getSupportedExecutionPermissions';
      Params: [];
      ReturnType: GetSupportedExecutionPermissionsResult;
    },
    {
      Method: 'wallet_getGrantedExecutionPermissions';
      Params: [];
      ReturnType: GetGrantedExecutionPermissionsResult;
    },
  ];
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * A Viem client extended with ERC-7715 execution permission RPC methods.
 *
 * This client type allows for interaction with wallets that support ERC-7715
 * through the standard Viem client interface, with added type safety for
 * execution permission methods.
 */
export type MetaMaskExtensionClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  MetaMaskExtensionSchema
>;
