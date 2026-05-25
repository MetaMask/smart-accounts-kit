import type { Account, Hex } from 'viem';

import type { Caveats } from '../caveatBuilder';
import type { PermissionContext, SmartAccountsEnvironment } from '../types';

/**
 * Payment requirement details supplied by an x402 server challenge.
 *
 * These values are used to scope and construct the delegation that will be
 * returned by a {@link x402DelegationProvider}.
 */
export type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
};

/**
 * Encoded delegation response consumed by x402 payment flows.
 *
 * The payload includes the delegation manager address, the encoded permission
 * context to use for execution, and the delegator account that signed it.
 */
export type x402DelegationProviderPaymentPayload = {
  delegationManager: Hex;
  permissionContext: Hex;
  delegator: Hex;
};

/**
 * Value that can be provided eagerly or derived lazily from runtime requirements.
 *
 * @template TResult - Resolved value type.
 */
export type MaybeDeferred<TResult> =
  | TResult
  | ((requirements: PaymentRequirements) => Promise<TResult>);

/**
 * Function that turns payment requirements into a signed delegation payload.
 */
export type x402DelegationProvider = (
  paymentRequirements: PaymentRequirements,
) => Promise<x402DelegationProviderPaymentPayload>;

/**
 * Configuration used to create a x402DelegationProvider.
 *
 * `account` is required and is used for signing the delegation.
 */
export type x402DelegationProviderConfig = {
  account: Account;
  environment: SmartAccountsEnvironment;
  from?: Hex;
  salt?: Hex;
  caveats?: MaybeDeferred<Caveats>;
  parentPermissionContext?: MaybeDeferred<PermissionContext>;
};
