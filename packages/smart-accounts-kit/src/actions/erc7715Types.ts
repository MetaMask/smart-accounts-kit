import type {
  AccountSigner,
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
  AccountSigner,
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
export type MetaMaskExtensionSchema = RpcSchema &
  [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_requestExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: PermissionRequest<AccountSigner, PermissionTypes>[];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: PermissionResponse<AccountSigner, PermissionTypes>[];
    },
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_getSupportedExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: [];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: GetSupportedExecutionPermissionsResult;
    },
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
 * A Viem client extended with MetaMask Snap-specific RPC methods.
 *
 * This client type allows for interaction with MetaMask Snaps through
 * the standard Viem client interface, with added type safety for
 * Snap-specific methods.
 */
export type MetaMaskExtensionClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  MetaMaskExtensionSchema
>;
