import type {
  PermissionRequest,
  PermissionResponse,
  PermissionTypes,
} from '@metamask/7715-permission-types';
import type { Account, Chain, Client, RpcSchema, Transport } from 'viem';

/**
 * RPC schema for MetaMask related methods.
 *
 * Extends the base RPC schema with methods specific to interacting with EIP-7715:
 * - `wallet_invokeSnap`: Invokes a method on a specific Snap.
 */
export type MetaMaskExtensionSchema = RpcSchema &
  [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_requestExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: PermissionRequest<PermissionTypes>[];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: PermissionResponse<PermissionTypes>[];
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
