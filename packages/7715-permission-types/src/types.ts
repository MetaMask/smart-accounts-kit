// //////////////////////////////////////////////////
// General Types
// //////////////////////////////////////////////////

/**
 * A hex-encoded string.
 */
export type Hex = `0x${string}`;

// //////////////////////////////////////////////////
// Permission Types
// //////////////////////////////////////////////////

/**
 * A base permission type that all permissions must extend.
 * `isAdjustmentAllowed` defines a boolean value that allows DApp to define whether the "permission" can be attenuated–adjusted to meet the user's terms.
 *
 * type - is an enum defined by the ERCs
 *
 * isAdjustmentAllowed - is a boolean that indicates whether the permission can be adjusted.
 *
 * data - is a record of the data that is associated with the permission, and the structure is defined by the ERCs.
 */
export type BasePermission = {
  type: string;
  isAdjustmentAllowed: boolean;
  data: Record<string, any>;
};

/**
 * A base rule type that all rules must extend.
 *
 * type - is an enum defined by the ERCs
 *
 * data - is a record of the data that is associated with the rule, and the structure is defined by the ERCs.
 */
export type Rule = {
  type: string;
  data: Record<string, any>;
};

// //////////////////////////////////////////////////
// MetaMask Permission Types
// //////////////////////////////////////////////////

/**
 * Base data for all MetaMask permissions.
 *
 * justification - is a human-readable explanation of why the permission is being requested.
 */
export type MetaMaskBasePermissionData = {
  justification?: string | null;
};

/**
 * A permission to stream native tokens.
 *
 * data.initialAmount - is the initial amount of the native token to be streamed. Defaults to 0.
 *
 * data.maxAmount - is the maximum amount of the native token to be streamed. Defaults to Max Uint256.
 *
 * data.amountPerSecond - is the amount of the native token to be streamed per second.
 *
 * data.startTime - is the start time of the stream. Defaults to current time.
 */
export type NativeTokenStreamPermission = BasePermission & {
  type: 'native-token-stream';
  data: MetaMaskBasePermissionData & {
    initialAmount?: Hex | null;
    maxAmount?: Hex | null;
    amountPerSecond: Hex;
    startTime?: number | null;
  };
};

/**
 * A permission to stream native tokens periodically.
 *
 * data.periodAmount - is the amount of the native token to be streamed per period.
 *
 * data.periodDuration - is the duration of the period in seconds.
 *
 * data.startTime - is the start time of the stream. Defaults to current time.
 */
export type NativeTokenPeriodicPermission = BasePermission & {
  type: 'native-token-periodic';
  data: MetaMaskBasePermissionData & {
    periodAmount: Hex;
    periodDuration: number;
    startTime?: number | null;
  };
};

/**
 * A permission to stream ERC20 tokens.
 *
 * data.initialAmount - is the initial amount of the ERC20 token to be streamed. Defaults to 0.
 *
 * data.maxAmount - is the maximum amount of the ERC20 token to be streamed. Defaults to Max Uint256.
 *
 * data.amountPerSecond - is the amount of the ERC20 token to be streamed per second.
 *
 * data.startTime - is the start time of the stream. Defaults to current time.
 *
 * data.tokenAddress - is the address of the ERC20 token to be streamed.
 */
export type Erc20TokenStreamPermission = BasePermission & {
  type: 'erc20-token-stream';
  data: MetaMaskBasePermissionData & {
    initialAmount?: Hex | null;
    maxAmount?: Hex | null;
    amountPerSecond: Hex;
    startTime?: number | null;
    tokenAddress: Hex;
  };
};

/**
 * A permission to stream ERC20 tokens periodically.
 *
 * data.periodAmount - is the amount of the ERC20 token to be streamed per period.
 *
 * data.periodDuration - is the duration of the period in seconds.
 *
 * data.startTime - is the start time of the stream. Defaults to current time.
 *
 * data.tokenAddress - is the address of the ERC20 token to be streamed per period.
 */
export type Erc20TokenPeriodicPermission = BasePermission & {
  type: 'erc20-token-periodic';
  data: MetaMaskBasePermissionData & {
    periodAmount: Hex;
    periodDuration: number;
    startTime?: number | null;
    tokenAddress: Hex;
  };
};

/**
 * A permission to revoke an ERC20 token allowance.
 */
export type Erc20TokenRevocationPermission = BasePermission & {
  type: 'erc20-token-revocation';
  data: MetaMaskBasePermissionData;
};

/**
 * A custom permission.
 *
 * data - is a record of the data that is associated with the permission, and the structure is defined by the ERCs.
 */
// TODO: Consider opening up permission types with Custom / Unknown permissions in subsequent versions.
// export type CustomPermission = BasePermission & {
//     type: 'custom';
//     data: MetaMaskBasePermissionData & Record<string, unknown>;
// };

/**
 * Represents the type of the ERC-7715 permissions that can be granted.
 */
export type PermissionTypes =
  | NativeTokenStreamPermission
  | NativeTokenPeriodicPermission
  | Erc20TokenStreamPermission
  | Erc20TokenPeriodicPermission
  | Erc20TokenRevocationPermission;

// //////////////////////////////////////////////////
// Permission Requests
// //////////////////////////////////////////////////

/**
 * Parameters for the `wallet_requestExecutionPermissions` JSON-RPC method.
 *
 * chainId - chainId defines the chain with EIP-155 which applies to this permission request and all addresses can be found defined by other parameters.
 *
 * address - address identifies the account being targetted for this permission request which is useful when a connection has been established and multiple accounts have been exposed. It is optional to let the user choose which account to grant permission for.
 *
 * to - is a field that identifies the DApp session account associated with the permission.
 *
 * permission - permission defines the allowed behavior the signer can do on behalf of the account. See the "Permission" section for details.
 *
 * rules - rules defined the restrictions or conditions that a signer MUST abide by when using a permission to act on behalf of an account. See the "Rule" section for details.
 */
export type PermissionRequest<TPermission extends PermissionTypes> = {
  chainId: Hex; // hex-encoding of uint256
  from?: Hex;
  to: Hex;
  permission: TPermission;
  rules?: Rule[] | null;
};

/**
 * Response from the `wallet_requestExecutionPermissions` JSON-RPC method.
 * First note that the response contains all of the parameters of the original request and it is not guaranteed that the values received are equivalent to those requested.
 *
 * context - is a catch-all to identify a permission for revoking permissions or submitting userOps, and can contain non-identifying data as well. It MAY be the `context` as defined in ERC-7679 and ERC-7710.
 *
 * dependencies - is an array of objects, each containing fields for `factory` and `factoryData` as defined in ERC-4337. Either both `factory` and `factoryData` must be specified in an entry, or neither. This array is used describe accounts that are not yet deployed but MUST be deployed in order for a permission to be successfully redeemed.
 *
 * delegationManager - is required as defined in ERC-7710.
 */
export type PermissionResponse<TPermission extends PermissionTypes> =
  PermissionRequest<TPermission> & {
    context: Hex;
    dependencies: {
      factory: Hex;
      factoryData: Hex;
    }[];
    delegationManager: Hex;
  };

/**
 * Parameters for the `wallet_revokeExecutionPermission` JSON-RPC method.
 *
 * permissionContext - the context identifier for the permission to be revoked
 */
export type RevokeExecutionPermissionRequestParams = {
  permissionContext: Hex;
};

/**
 * Response from the `wallet_revokeExecutionPermission` JSON-RPC method.
 * The wallet will respond with an empty response when successful.
 */
export type RevokeExecutionPermissionResponseResult = Record<string, never>;
