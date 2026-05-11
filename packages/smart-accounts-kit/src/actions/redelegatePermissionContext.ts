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
  ROOT_AUTHORITY,
} from '../delegation';
import type {
  Delegation,
  PermissionContext,
  SmartAccountsEnvironment,
} from '../types';
import { signDelegation } from './signDelegation';

type BaseRedelegatePermissionContextParameters = {
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
};

export type RedelegatePermissionContextParameters =
  BaseRedelegatePermissionContextParameters & {
    /** The address of the delegate to redelegate to */
    to: Address;
  };

export type RedelegatePermissionContextOpenParameters =
  BaseRedelegatePermissionContextParameters;

export type RedelegatePermissionContextReturnType = {
  /** The signed delegation that was created */
  delegation: Delegation;
  /** The new permission context with the redelegation prepended (encoded) */
  permissionContext: Hex;
};

type SigningClient<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
> = Client<Transport, TChain, TAccount> & {
  signTypedData: WalletClient['signTypedData'];
};

/**
 * Shared workflow for creating, signing and prepending a redelegation to a
 * permission context. The caller decides whether to produce a specific or open
 * redelegation by supplying the appropriate `unsignedDelegation`.
 *
 * @param client - Wallet client with signing capability.
 * @param options - Workflow options.
 * @param options.account - Account to sign the delegation with.
 * @param options.environment - Environment configuration.
 * @param options.delegations - The decoded delegation chain (leaf first).
 * @param options.unsignedDelegation - The new (unsigned) redelegation to prepend.
 * @param options.chainId - The chain ID for the signature.
 * @returns The signed delegation and updated, encoded permission context.
 */
async function signAndPrependRedelegation(
  client: SigningClient<Chain | undefined, Account | undefined>,
  options: {
    account: Account;
    environment: SmartAccountsEnvironment;
    delegations: Delegation[];
    unsignedDelegation: Delegation;
    chainId: number;
  },
): Promise<RedelegatePermissionContextReturnType> {
  const { account, environment, delegations, unsignedDelegation, chainId } =
    options;

  const signature = await signDelegation(client, {
    account,
    delegation: unsignedDelegation,
    delegationManager: environment.DelegationManager,
    chainId,
    // Redelegations always inherit from a parent delegation (enforced by
    // `resolveRedelegationArgs`), so the parent's caveats provide the
    // restriction even when the redelegation itself adds no extra caveats.
    // This mirrors `resolveCaveats`, which also allows empty caveats in this
    // case.
    allowInsecureUnrestrictedDelegation: true,
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
 * Resolves and validates shared inputs used by both redelegation actions.
 *
 * @param client - Wallet client with signing capability.
 * @param parameters - The base redelegation parameters.
 * @returns The resolved account, decoded chain and parent (leaf) delegation.
 */
function resolveRedelegationArgs<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: SigningClient<TChain, TAccount>,
  parameters: BaseRedelegatePermissionContextParameters,
): {
  account: Account;
  delegations: Delegation[];
  parentDelegation: Delegation;
  from: Hex;
} {
  const { account: accountParam = client.account, permissionContext } =
    parameters;

  if (!accountParam) {
    throw new BaseError('Account not found. Please provide an account.');
  }

  const account = parseAccount(accountParam);
  const delegations = decodeDelegations(permissionContext);
  const parentDelegation = delegations[0];

  if (!parentDelegation) {
    throw new BaseError(
      'Permission context must contain at least one delegation',
    );
  }

  const isParentOpenDelegation =
    parentDelegation.authority.toLowerCase() === ROOT_AUTHORITY.toLowerCase();

  const from = isParentOpenDelegation
    ? account.address
    : parentDelegation.delegate;

  return { account, delegations, parentDelegation, from };
}

/**
 * Creates a redelegation to a specific delegate from an existing permission
 * context and returns both the signed delegation and the updated permission
 * context.
 *
 * This action handles the complete redelegation workflow:
 * 1. Extracts the leaf delegation from the permission context
 * 2. Creates a new delegation inheriting from it
 * 3. Signs the new delegation
 * 4. Prepends it to the delegation chain
 * 5. Returns the encoded permission context
 *
 * Use {@link redelegatePermissionContextOpen} to create an open redelegation
 * (delegate set to `ANY_BENEFICIARY`).
 *
 * @param client - Wallet client with signing capability.
 * @param parameters - Redelegation parameters.
 * @returns Object containing the signed delegation and new permission context.
 *
 * @example
 * ```ts
 * const result = await redelegatePermissionContext(walletClient, {
 *   environment,
 *   permissionContext: erc7715Response.context,
 *   chainId: 11155111,
 *   to: charlie.address,
 *   caveats: [timestampCaveat],
 * });
 *
 * await client.sendUserOperationWithDelegation({
 *   calls: [{
 *     to: contractAddress,
 *     data: callData,
 *     permissionContext: result.permissionContext,
 *     delegationManager: environment.DelegationManager,
 *   }],
 * });
 * ```
 */
export async function redelegatePermissionContext<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: SigningClient<TChain, TAccount>,
  parameters: RedelegatePermissionContextParameters,
): Promise<RedelegatePermissionContextReturnType> {
  const { environment, chainId, scope, caveats, salt, to } = parameters;

  const { account, delegations, parentDelegation, from } =
    resolveRedelegationArgs(client, parameters);

  trackSmartAccountsKitFunctionCall('redelegatePermissionContext', {
    chainId,
    hasScope: scope !== undefined,
    hasCaveats: caveats !== undefined,
  });

  const unsignedDelegation = createDelegation({
    environment,
    from,
    to,
    scope,
    caveats,
    parentDelegation,
    salt,
  });

  return signAndPrependRedelegation(client, {
    account,
    environment,
    delegations,
    unsignedDelegation,
    chainId,
  });
}

/**
 * Creates an open redelegation (delegate set to `ANY_BENEFICIARY`) from an
 * existing permission context and returns both the signed delegation and the
 * updated permission context.
 *
 * Use {@link redelegatePermissionContext} when you want to delegate to a
 * specific address.
 *
 * @param client - Wallet client with signing capability.
 * @param parameters - Open redelegation parameters.
 * @returns Object containing the signed delegation and new permission context.
 *
 * @example
 * ```ts
 * const result = await redelegatePermissionContextOpen(walletClient, {
 *   environment,
 *   permissionContext: erc7715Response.context,
 *   chainId: 11155111,
 *   caveats: [limitedCallsCaveat],
 * });
 * ```
 */
export async function redelegatePermissionContextOpen<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: SigningClient<TChain, TAccount>,
  parameters: RedelegatePermissionContextOpenParameters,
): Promise<RedelegatePermissionContextReturnType> {
  const { environment, chainId, scope, caveats, salt } = parameters;

  const { account, delegations, parentDelegation, from } =
    resolveRedelegationArgs(client, parameters);

  trackSmartAccountsKitFunctionCall('redelegatePermissionContextOpen', {
    chainId,
    hasScope: scope !== undefined,
    hasCaveats: caveats !== undefined,
  });

  const unsignedDelegation = createOpenDelegation({
    environment,
    from,
    scope,
    caveats,
    parentDelegation,
    salt,
  });

  return signAndPrependRedelegation(client, {
    account,
    environment,
    delegations,
    unsignedDelegation,
    chainId,
  });
}

/**
 * Resolves the chain id, falling back to the client's configured chain.
 *
 * @param client - The client to read the chain id from.
 * @param client.chain - The client's configured chain.
 * @param chainId - The explicit chain id, if provided.
 * @returns The resolved chain id.
 */
function resolveChainId(
  client: { chain?: { id: number } | undefined },
  chainId: number | undefined,
): number {
  if (chainId !== undefined) {
    return chainId;
  }
  if (!client.chain?.id) {
    throw new BaseError(
      'Chain ID is required. Either provide it in parameters or configure the client with a chain.',
    );
  }
  return client.chain.id;
}

/**
 * Creates redelegation actions that can be used to extend a wallet client.
 *
 * Adds two actions:
 * - `redelegatePermissionContext` for redelegating to a specific delegate.
 * - `redelegatePermissionContextOpen` for creating an open redelegation.
 *
 * @returns A function that can be used with the wallet client `extend` method.
 *
 * @example
 * ```ts
 * const walletClient = createWalletClient({
 *   chain: sepolia,
 *   transport: http(),
 * }).extend(redelegatePermissionContextActions());
 *
 * // Specific redelegation
 * const specific = await walletClient.redelegatePermissionContext({
 *   environment,
 *   permissionContext: erc7715Response.context,
 *   to: charlie.address,
 * });
 *
 * // Open redelegation
 * const open = await walletClient.redelegatePermissionContextOpen({
 *   environment,
 *   permissionContext: erc7715Response.context,
 * });
 * ```
 */
export function redelegatePermissionContextActions() {
  return <
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
  >(
    client: SigningClient<TChain, TAccount>,
  ) => ({
    redelegatePermissionContext: async (
      parameters: Omit<RedelegatePermissionContextParameters, 'chainId'> & {
        chainId?: number;
      },
    ) =>
      redelegatePermissionContext(client, {
        ...parameters,
        chainId: resolveChainId(client, parameters.chainId),
      }),
    redelegatePermissionContextOpen: async (
      parameters: Omit<RedelegatePermissionContextOpenParameters, 'chainId'> & {
        chainId?: number;
      },
    ) =>
      redelegatePermissionContextOpen(client, {
        ...parameters,
        chainId: resolveChainId(client, parameters.chainId),
      }),
  });
}
