import type {
  Account,
  Address,
  Chain,
  Client,
  Hex,
  Transport,
  WalletClient,
} from 'viem';
import { BaseError } from 'viem';
import { parseAccount } from 'viem/accounts';

import { trackSmartAccountsKitFunctionCall } from '../analytics';
import type { Caveats } from '../caveatBuilder';
import type { ScopeConfig } from '../caveatBuilder/scope';
import {
  createDelegation,
  createOpenDelegation,
  decodeDelegations,
  encodeDelegations,
} from '../delegation';
import type {
  Delegation,
  PermissionContext,
  SmartAccountsEnvironment,
} from '../types';
import { signDelegation } from './signDelegation';

export type RedelegatePermissionContextParameters = {
  /** Account to sign the delegation with */
  account?: Account | Address;
  /** Environment configuration */
  environment: SmartAccountsEnvironment;
  /** The permission context to redelegate from (i.e., from ERC-7715 response) */
  permissionContext: PermissionContext;
  /** The chain ID for the signature */
  chainId: number;
  /** Optional scope - if not provided, inherits from parent */
  scope?: ScopeConfig;
  /** Additional caveats to apply to the redelegation */
  caveats?: Caveats;
  /** Optional salt for uniqueness */
  salt?: Hex;
  /** The address of the delegate to redelegate to */
  to?: Address;
};

export type RedelegatePermissionContextReturnType = {
  /** The signed delegation that was created */
  delegation: Delegation;
  /** The new permission context with the redelegation prepended (encoded) */
  permissionContext: Hex;
};

/**
 * Creates a redelegation from an existing permission context and returns
 * both the signed delegation and the updated permission context.
 *
 * This action handles the complete redelegation workflow:
 * 1. Extracts the leaf delegation from the permission context
 * 2. Creates a new delegation inheriting from it
 * 3. Signs the new delegation
 * 4. Prepends it to the delegation chain
 * 5. Returns the encoded permission context
 *
 * @param client - Wallet client with signing capability
 * @param parameters - Redelegation parameters
 * @returns Object containing the signed delegation and new permission context
 *
 * @example
 * ```ts
 * // Redelegate to a specific address
 * const result = await redelegatePermissionContext(walletClient, {
 *   permissionContext: erc7715Response.context,
 *   delegationManager: environment.DelegationManager,
 *   chainId: 11155111,
 *   environment,
 *   delegate: charlie.address,
 *   caveats: [timestampCaveat],
 * });
 *
 * // Use the new permission context in a transaction
 * await client.sendUserOperationWithDelegation({
 *   calls: [{
 *     to: contractAddress,
 *     data: callData,
 *     permissionContext: result.permissionContext,
 *     delegationManager: environment.DelegationManager,
 *   }],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Create an open redelegation (anyone can use it)
 * const result = await redelegatePermissionContext(walletClient, {
 *   permissionContext: erc7715Response.context,
 *   delegationManager: environment.DelegationManager,
 *   chainId: 11155111,
 *   environment,
 *   // No delegate = open delegation
 *   caveats: [limitedCallsCaveat],
 * });
 * ```
 */
export async function redelegatePermissionContext<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: Client<Transport, TChain, TAccount> & {
    signTypedData: WalletClient['signTypedData'];
  },
  parameters: RedelegatePermissionContextParameters,
): Promise<RedelegatePermissionContextReturnType> {
  const {
    account: accountParam = client.account,
    environment,
    permissionContext,
    chainId,
    scope,
    caveats,
    salt,
    to,
  } = parameters;

  if (!accountParam) {
    throw new BaseError('Account not found. Please provide an account.');
  }

  const account = parseAccount(accountParam);

  trackSmartAccountsKitFunctionCall('redelegatePermissionContext', {
    chainId,
    hasDelegate: Boolean(parameters.to),
    hasScope: scope !== undefined,
    hasCaveats: caveats !== undefined,
  });

  const delegations = decodeDelegations(permissionContext);

  const parentDelegation = delegations[0];

  if (!parentDelegation) {
    throw new BaseError(
      'Permission context must contain at least one delegation',
    );
  }

  const createDelegationOptions = {
    environment,
    from: account.address,
    scope,
    caveats,
    parentDelegation,
    salt,
  };

  const unsignedDelegation = to
    ? createDelegation({
        ...createDelegationOptions,
        to,
      })
    : createOpenDelegation(createDelegationOptions);

  const signature = await signDelegation(client, {
    account,
    delegation: unsignedDelegation,
    delegationManager: environment.DelegationManager,
    chainId,
  });

  const signedDelegation: Delegation = {
    ...unsignedDelegation,
    signature,
  };

  const newPermissionContext = encodeDelegations([
    signedDelegation,
    ...delegations,
  ]);

  return {
    delegation: signedDelegation,
    permissionContext: newPermissionContext,
  };
}

/**
 * Creates redelegation actions that can be used to extend a wallet client.
 *
 * @returns A function that can be used with wallet client extend method.
 * @example
 * ```ts
 * const walletClient = createWalletClient({
 *   chain: sepolia,
 *   transport: http()
 * }).extend(redelegatePermissionContextActions());
 *
 * // Now you can call it directly on the client
 * const result = await walletClient.redelegatePermissionContext({
 *   environment,
 *   permissionContext: erc7715Response.context,
 *   to: charlie.address,
 * });
 * ```
 */
export function redelegatePermissionContextActions() {
  return <
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
  >(
    client: Client<Transport, TChain, TAccount> & {
      signTypedData: WalletClient['signTypedData'];
    },
  ) => ({
    redelegatePermissionContext: async (
      parameters: Omit<RedelegatePermissionContextParameters, 'chainId'> & {
        chainId?: number;
      },
    ) =>
      redelegatePermissionContext(client, {
        chainId:
          parameters.chainId ??
          (() => {
            if (!client.chain?.id) {
              throw new BaseError(
                'Chain ID is required. Either provide it in parameters or configure the client with a chain.',
              );
            }
            return client.chain.id;
          })(),
        ...parameters,
      }),
  });
}
