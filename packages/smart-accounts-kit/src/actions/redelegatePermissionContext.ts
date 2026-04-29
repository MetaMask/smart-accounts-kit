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
  type CreateDelegationOptions,
  type CreateOpenDelegationOptions,
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
  /** The permission context to redelegate from (from ERC-7715 response) */
  permissionContext: PermissionContext;
  /** The address of the delegation manager contract */
  delegationManager: Address;
  /** The chain ID for the signature */
  chainId: number;
  /** Optional scope - if not provided, inherits from parent */
  scope?: ScopeConfig;
  /** Additional caveats to apply to the redelegation */
  caveats?: Caveats;
  /** Optional salt for uniqueness */
  salt?: Hex;
  /** Name of the DelegationManager contract */
  name?: string;
  /** Version of the DelegationManager contract */
  version?: string;
  /** Whether to allow insecure unrestricted delegation */
  allowInsecureUnrestrictedDelegation?: boolean;
} & (
  | { delegate: Address } // Specific delegate
  | { delegate?: never } // Open delegation
);

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
    delegationManager,
    chainId,
    scope,
    caveats,
    salt,
    name = 'DelegationManager',
    version = '1',
    allowInsecureUnrestrictedDelegation = false,
  } = parameters;

  if (!accountParam) {
    throw new BaseError('Account not found. Please provide an account.');
  }

  const account = parseAccount(accountParam);

  trackSmartAccountsKitFunctionCall('redelegatePermissionContext', {
    chainId,
    hasDelegate: 'delegate' in parameters && parameters.delegate !== undefined,
    hasScope: scope !== undefined,
    hasCaveats: caveats !== undefined,
  });

  // Decode the permission context to get the delegation chain
  const delegations = decodeDelegations(permissionContext);

  if (delegations.length === 0) {
    throw new BaseError(
      'Permission context must contain at least one delegation',
    );
  }

  // The leaf delegation is the first element (chain ordered leaf to root)
  const leafDelegation = delegations[0];

  // Create the unsigned delegation
  // We always pass parentDelegation as the leaf delegation
  // TypeScript struggles with the discriminated union, so we build the object explicitly
  let unsignedDelegation: Omit<Delegation, 'signature'>;

  const commonOptions = {
    environment,
    from: account.address,
    parentDelegation: leafDelegation as Delegation | Hex,
    ...(scope !== undefined && { scope }),
    ...(caveats !== undefined && { caveats }),
    ...(salt !== undefined && { salt }),
  };

  if ('delegate' in parameters && parameters.delegate) {
    unsignedDelegation = createDelegation({
      ...commonOptions,
      to: parameters.delegate,
    } as CreateDelegationOptions);
  } else {
    unsignedDelegation = createOpenDelegation(
      commonOptions as CreateOpenDelegationOptions,
    );
  }

  // Sign the delegation
  const signature = await signDelegation(client, {
    account: accountParam,
    delegation: unsignedDelegation,
    delegationManager,
    chainId,
    name,
    version,
    allowInsecureUnrestrictedDelegation,
  });

  // Create the signed delegation
  const signedDelegation: Delegation = {
    ...unsignedDelegation,
    signature,
  };

  // Prepend the new delegation to create the new chain
  const newDelegationChain = [signedDelegation, ...delegations];

  // Return both the delegation and the encoded permission context
  return {
    delegation: signedDelegation,
    permissionContext: encodeDelegations(newDelegationChain),
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
 *   permissionContext: erc7715Response.context,
 *   delegate: charlie.address,
 *   environment,
 *   delegationManager: environment.DelegationManager,
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
