import type { Client, WalletClient } from 'viem';
import type { BundlerClient } from 'viem/account-abstraction';

import type {
  SendTransactionWithDelegationParameters,
  SendUserOperationWithDelegationParameters,
} from './erc7710RedeemDelegationAction';
import {
  sendTransactionWithDelegationAction,
  sendUserOperationWithDelegationAction,
} from './erc7710RedeemDelegationAction';
import { erc7715GetGrantedExecutionPermissionsAction } from './erc7715GetGrantedExecutionPermissionsAction';
import { erc7715GetSupportedExecutionPermissionsAction } from './erc7715GetSupportedExecutionPermissionsAction';
import { erc7715RequestExecutionPermissionsAction } from './erc7715RequestExecutionPermissionsAction';
import type {
  MetaMaskExtensionClient,
  RequestExecutionPermissionsParameters,
} from './erc7715RequestExecutionPermissionsAction';
import {
  redelegatePermissionContextAction,
  redelegatePermissionContextOpenAction,
  type RedelegatePermissionContextOpenParameters,
  type RedelegatePermissionContextParameters,
} from './redelegatePermissionContext';

export {
  // Individual action functions
  getErc20PeriodTransferEnforcerAvailableAmount,
  getErc20StreamingEnforcerAvailableAmount,
  getMultiTokenPeriodEnforcerAvailableAmount,
  getNativeTokenPeriodTransferEnforcerAvailableAmount,
  getNativeTokenStreamingEnforcerAvailableAmount,
  // Action builder
  caveatEnforcerActions,
  // Parameter types
  type CaveatEnforcerParams,
  // Result types
  type PeriodTransferResult,
  type StreamingResult,
} from './getCaveatAvailableAmount';

export { isValid7702Implementation } from './isValid7702Implementation';

// Signing actions
export {
  signDelegation,
  signDelegationActions,
  type SignDelegationParameters,
  type SignDelegationReturnType,
} from './signDelegation';

export {
  signUserOperation,
  signUserOperationActions,
  type SignUserOperationParameters,
  type SignUserOperationReturnType,
} from './signUserOperation';

// Redelegation actions
export {
  redelegatePermissionContextAction,
  redelegatePermissionContextOpenAction,
  type RedelegatePermissionContextParameters,
  type RedelegatePermissionContextOpenParameters,
  type RedelegatePermissionContextReturnType,
} from './redelegatePermissionContext';

export {
  erc7715RequestExecutionPermissionsAction as requestExecutionPermissions,
  type MetaMaskExtensionClient,
  type MetaMaskExtensionSchema,
  type RequestExecutionPermissionsParameters,
  type RequestExecutionPermissionsReturnType,
} from './erc7715RequestExecutionPermissionsAction';

export type { PermissionRequestParameter } from './erc7715Types';

export { erc7715GetSupportedExecutionPermissionsAction as getSupportedExecutionPermissions } from './erc7715GetSupportedExecutionPermissionsAction';

export { erc7715GetGrantedExecutionPermissionsAction as getGrantedExecutionPermissions } from './erc7715GetGrantedExecutionPermissionsAction';

export {
  type GetSupportedExecutionPermissionsResult,
  type GetGrantedExecutionPermissionsResult,
  type Rule,
  type SupportedPermissionInfo,
  type PermissionTypes,
  type NativeTokenStreamPermission,
  type NativeTokenPeriodicPermission,
  type NativeTokenAllowancePermission,
  type Erc20TokenStreamPermission,
  type Erc20TokenPeriodicPermission,
  type Erc20TokenAllowancePermission,
  type Erc20TokenRevocationPermission,
  type TokenApprovalRevocationPermission,
  type RpcGetSupportedExecutionPermissionsResult,
  type RpcGetGrantedExecutionPermissionsResult,
  type RpcSupportedPermissionInfo,
} from './erc7715Types';

export type { DelegatedCall } from './erc7710RedeemDelegationAction';

/**
 * Extends a viem client with ERC-7715 provider actions.
 *
 * @returns A function that decorates a client with ERC-7715 provider actions.
 *
 * @example
 * ```typescript
 * const providerClient = createClient({
 *   chain: sepolia,
 *   transport: custom(window.ethereum),
 * }).extend(erc7715ProviderActions());
 *
 * await providerClient.requestExecutionPermissions({
 *   requests: [permissionRequest],
 * });
 *
 * const supported = await providerClient.getSupportedExecutionPermissions();
 * const granted = await providerClient.getGrantedExecutionPermissions();
 * ```
 */
export const erc7715ProviderActions = () => (client: Client) => ({
  requestExecutionPermissions: async (
    parameters: RequestExecutionPermissionsParameters,
  ) => {
    return erc7715RequestExecutionPermissionsAction(
      client as MetaMaskExtensionClient,
      parameters,
    );
  },
  getSupportedExecutionPermissions: async () => {
    return erc7715GetSupportedExecutionPermissionsAction(
      client as MetaMaskExtensionClient,
    );
  },
  getGrantedExecutionPermissions: async () => {
    return erc7715GetGrantedExecutionPermissionsAction(
      client as MetaMaskExtensionClient,
    );
  },
});

/**
 * Type for a viem Client extended with ERC-7715 provider actions.
 * Use this to type variables for deferred initialization.
 *
 * @example
 * ```typescript
 * let client: Erc7715Client | null = null;
 *
 * function setupClient() {
 *   client = createClient({
 *     chain: sepolia,
 *     transport: custom(window.ethereum),
 *   }).extend(erc7715ProviderActions());
 * }
 * ```
 */
export type Erc7715Client = Client &
  ReturnType<ReturnType<typeof erc7715ProviderActions>>;

/**
 * Type for a viem WalletClient extended with ERC-7710 wallet actions.
 * Use this to type variables for deferred initialization.
 *
 * @example
 * ```typescript
 * let walletClient: Erc7710WalletClient | null = null;
 *
 * function setupClient() {
 *   walletClient = createWalletClient({
 *     account,
 *     chain: sepolia,
 *     transport: custom(window.ethereum),
 *   }).extend(erc7710WalletActions());
 * }
 * ```
 */
export type Erc7710WalletClient = WalletClient &
  ReturnType<ReturnType<typeof erc7710WalletActions>>;

/**
 * Extends a viem wallet client with ERC-7710 wallet actions.
 *
 * @returns A function that decorates a wallet client with ERC-7710 wallet actions.
 *
 * @example
 * ```typescript
 * const walletClient = createWalletClient({
 *   account,
 *   chain: sepolia,
 *   transport: custom(window.ethereum),
 * }).extend(erc7710WalletActions());
 *
 * await walletClient.sendTransactionWithDelegation({
 *   account,
 *   chain: sepolia,
 *   to: recipient,
 *   value: 0n,
 *   data: callData,
 *   permissionContext,
 *   delegationManager: environment.DelegationManager,
 * });
 *
 * await walletClient.redelegatePermissionContext({
 *   environment,
 *   permissionContext,
 *   to: anotherDelegate,
 *   // optional when client.chain is configured
 *   chainId: sepolia.id,
 * });
 * ```
 */
export const erc7710WalletActions = () => (client: WalletClient) => ({
  sendTransactionWithDelegation: async (
    args: SendTransactionWithDelegationParameters,
  ) => sendTransactionWithDelegationAction(client, args),
  redelegatePermissionContext: async (
    parameters: RedelegatePermissionContextParameters,
  ) => redelegatePermissionContextAction(client, parameters),
  redelegatePermissionContextOpen: async (
    parameters: RedelegatePermissionContextOpenParameters,
  ) => redelegatePermissionContextOpenAction(client, parameters),
});

/**
 * Extends a viem bundler client with ERC-7710 bundler actions.
 *
 * @returns A function that decorates a bundler client with ERC-7710 bundler actions.
 *
 * @example
 * ```typescript
 * const bundlerClient = createBundlerClient({
 *   account: smartAccount,
 *   chain: sepolia,
 *   transport: http(bundlerUrl),
 * }).extend(erc7710BundlerActions());
 *
 * const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
 *   publicClient,
 *   calls: [
 *     {
 *       to: recipient,
 *       data: callData,
 *       value: 0n,
 *       permissionContext,
 *       delegationManager: environment.DelegationManager,
 *     },
 *   ],
 * });
 * ```
 */
export const erc7710BundlerActions = () => (client: Client) => ({
  sendUserOperationWithDelegation: async (
    args: SendUserOperationWithDelegationParameters,
  ) => sendUserOperationWithDelegationAction(client as BundlerClient, args),
});
