import type {
  PermissionTypes as RpcPermissionTypes,
  PermissionRequest as RpcPermissionRequest,
  PermissionResponse as RpcPermissionResponse,
} from '@metamask/7715-permission-types';
import type {
  Client,
  Account,
  Hex,
  RpcSchema,
  Transport,
  Chain,
  Address,
} from 'viem';

// =============================================================================
// Developer-facing types
// These types represent the public API. Use bigint, number, Hex, and Address for
// developer-friendly values. These are the only types consumers of this package
// need to work with.
// =============================================================================

type BasePermission = {
  type: string;
  isAdjustmentAllowed: boolean;
  data: Record<string, unknown>;
};

/**
 * Native token stream permission.
 */
export type NativeTokenStreamPermission = BasePermission & {
  type: 'native-token-stream';
  data: {
    initialAmount?: bigint;
    maxAmount?: bigint;
    amountPerSecond: bigint;
    startTime?: number;
    justification?: string;
  };
};

/**
 * Native token periodic permission.
 */
export type NativeTokenPeriodicPermission = BasePermission & {
  type: 'native-token-periodic';
  data: {
    periodAmount: bigint;
    periodDuration: number;
    startTime?: number;
    justification?: string;
  };
};

/**
 * ERC-20 token stream permission.
 */
export type Erc20TokenStreamPermission = BasePermission & {
  type: 'erc20-token-stream';
  data: {
    initialAmount?: bigint;
    maxAmount?: bigint;
    amountPerSecond: bigint;
    startTime?: number;
    tokenAddress: Address;
    justification?: string;
  };
};

/**
 * ERC-20 token periodic permission.
 */
export type Erc20TokenPeriodicPermission = BasePermission & {
  type: 'erc20-token-periodic';
  data: {
    periodAmount: bigint;
    periodDuration: number;
    startTime?: number;
    tokenAddress: Address;
    justification?: string;
  };
};

/**
 * ERC-20 token revocation permission.
 */
export type Erc20TokenRevocationPermission = BasePermission & {
  type: 'erc20-token-revocation';
  data: {
    justification?: string;
  };
};

/**
 * Permission types.
 */
export type PermissionTypes =
  | NativeTokenStreamPermission
  | NativeTokenPeriodicPermission
  | Erc20TokenStreamPermission
  | Erc20TokenPeriodicPermission
  | Erc20TokenRevocationPermission;

/**
 * Parameters for a single permission request (input to requestExecutionPermissions).
 */
export type PermissionRequestParameter = {
  chainId: number;
  permission: PermissionTypes;
  to: Hex;
  from?: Address | undefined | null;
  expiry?: number | undefined | null;
};

/**
 * Supported execution permissions for a specific permission type.
 */
export type SupportedPermissionInfo = {
  chainIds: number[];
  ruleTypes: string[];
};

/**
 * Result type for the getSupportedExecutionPermissions action.
 */
export type GetSupportedExecutionPermissionsResult = Record<
  string,
  SupportedPermissionInfo
>;

/**
 * Result type for the getGrantedExecutionPermissions action.
 */
export type GetGrantedExecutionPermissionsResult =
  PermissionResponse<PermissionTypes>[];

/**
 * Permission request.
 */
export type PermissionRequest<TPermission extends PermissionTypes> = {
  chainId: number;
  from?: Hex;
  to: Hex;
  permission: TPermission;
  rules?: Record<string, unknown>[] | null;
};

/**
 * Permission response.
 */
export type PermissionResponse<TPermission extends PermissionTypes> =
  PermissionRequest<TPermission> & {
    context: Hex;
    dependencies: {
      factory: Address;
      factoryData: Hex;
    }[];
    delegationManager: Address;
  };

// =============================================================================
// RPC types (internal)
// These types represent the wire format for JSON-RPC calls. Use Hex strings
// for chain IDs and token amounts. Used internally when communicating with
// the wallet; not exposed to package consumers.
// =============================================================================

/**
 * RPC format: supported execution permissions for a specific permission type.
 */
export type RpcSupportedPermissionInfo = {
  chainIds: Hex[];
  ruleTypes: string[];
};

/**
 * RPC format: result type for the getSupportedExecutionPermissions action.
 */
export type RpcGetSupportedExecutionPermissionsResult = Record<
  string,
  RpcSupportedPermissionInfo
>;

/**
 * RPC format: result type for the getGrantedExecutionPermissions action.
 */
export type RpcGetGrantedExecutionPermissionsResult =
  RpcPermissionResponse<RpcPermissionTypes>[];

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
      Method: 'wallet_requestExecutionPermissions';
      Params: RpcPermissionRequest<RpcPermissionTypes>[];
      ReturnType: RpcPermissionResponse<RpcPermissionTypes>[];
    },
    {
      Method: 'wallet_getSupportedExecutionPermissions';
      Params: [];
      ReturnType: RpcGetSupportedExecutionPermissionsResult;
    },
    {
      Method: 'wallet_getGrantedExecutionPermissions';
      Params: [];
      ReturnType: RpcGetGrantedExecutionPermissionsResult;
    },
  ];

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
