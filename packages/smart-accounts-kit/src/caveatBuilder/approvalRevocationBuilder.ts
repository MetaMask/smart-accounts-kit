import {
  createApprovalRevocationTerms,
  type ApprovalRevocationTerms,
} from '@metamask/delegation-core';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const approvalRevocation = 'approvalRevocation';

export type ApprovalRevocationBuilderConfig = ApprovalRevocationTerms;

/**
 * Builds a caveat struct for the ApprovalRevocationEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing enabled revocation primitives.
 * @returns The Caveat.
 */
export const approvalRevocationBuilder = (
  environment: SmartAccountsEnvironment,
  config: ApprovalRevocationBuilderConfig,
): Caveat => {
  const terms = createApprovalRevocationTerms(config);

  const {
    caveatEnforcers: { ApprovalRevocationEnforcer },
  } = environment;

  if (!ApprovalRevocationEnforcer) {
    throw new Error('ApprovalRevocationEnforcer not found in environment');
  }

  return {
    enforcer: ApprovalRevocationEnforcer,
    terms,
    args: '0x00',
  };
};
