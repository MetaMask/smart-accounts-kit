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

export {
  erc7715RequestExecutionPermissionsAction as requestExecutionPermissions,
  type MetaMaskExtensionClient,
  type MetaMaskExtensionSchema,
  type PermissionRequestParameter,
  type RequestExecutionPermissionsParameters,
  type RequestExecutionPermissionsReturnType,
} from './erc7715RequestExecutionPermissionsAction';

export { erc7715GetSupportedExecutionPermissionsAction as getSupportedExecutionPermissions } from './erc7715GetSupportedExecutionPermissionsAction';

export { erc7715GetGrantedExecutionPermissionsAction as getGrantedExecutionPermissions } from './erc7715GetGrantedExecutionPermissionsAction';

export {
  type GetSupportedExecutionPermissionsResult,
  type GetGrantedExecutionPermissionsResult,
  type SupportedPermissionInfo,
} from './erc7715Types';

export type { DelegatedCall } from './erc7710RedeemDelegationAction';

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
 * Use this to type variables that will be assigned an extended client later.
 *
 * @example
 * ```typescript
 * let client: Erc7715Client | null = null;
 *
 * function setupClient() {
 *   client = createWalletClient({
 *     chain: sepolia,
 *     transport: custom(window.ethereum),
 *   }).extend(erc7715ProviderActions());
 * }
 * ```
 */
export type Erc7715Client = Client &
  ReturnType<ReturnType<typeof erc7715ProviderActions>>;

export const erc7710WalletActions = () => (client: WalletClient) => ({
  sendTransactionWithDelegation: async (
    args: SendTransactionWithDelegationParameters,
  ) => sendTransactionWithDelegationAction(client, args),
});

export const erc7710BundlerActions = () => (client: Client) => ({
  sendUserOperationWithDelegation: async (
    args: SendUserOperationWithDelegationParameters,
  ) => sendUserOperationWithDelegationAction(client as BundlerClient, args),
});
