import type { Client, Transport, Chain, Account } from 'viem';

import { trackSmartAccountsKitFunctionCall } from '../analytics';
import type { SmartAccountsEnvironment } from '../types';
import {
  caveatEnforcerActions,
  type CaveatEnforcerParams,
  type PeriodTransferResult,
  type StreamingResult,
} from './getCaveatAvailableAmount';

/**
 * Type for client extended with caveat enforcer actions.
 */
export type CaveatEnforcerClient<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
> = Client<TTransport, TChain, TAccount> &
  ReturnType<ReturnType<typeof caveatEnforcerActions>>;

/**
 * Create a viem client extended with caveat enforcer actions.
 *
 * @param params - The parameters object.
 * @param params.client - The viem client.
 * @param params.environment - The SmartAccountsEnvironment.
 * @returns The extended client with caveat enforcer actions.
 */
export function createCaveatEnforcerClient<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
>({
  client,
  environment,
}: {
  client: Client<TTransport, TChain, TAccount>;
  environment: SmartAccountsEnvironment;
}): CaveatEnforcerClient<TTransport, TChain, TAccount> {
  trackSmartAccountsKitFunctionCall('createCaveatEnforcerClient', {
    chainId: client.chain?.id ?? null,
  });

  return client.extend(caveatEnforcerActions({ environment }));
}

// Re-export types for convenience
export type { CaveatEnforcerParams, PeriodTransferResult, StreamingResult };
