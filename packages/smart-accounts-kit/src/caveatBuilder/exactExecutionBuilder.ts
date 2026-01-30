import { createExactExecutionTerms } from '@metamask/delegation-core';
import { isAddress } from 'viem';

import type { ExecutionStruct } from '../executions';
import type { Caveat, SmartAccountsEnvironment } from '../types';

export const exactExecution = 'exactExecution';

export type ExactExecutionBuilderConfig = {
  /**
   * The execution that must be matched exactly.
   * Specifies the target address, value, and calldata.
   */
  execution: ExecutionStruct;
};

/**
 * Builds a caveat struct for ExactExecutionEnforcer.
 * This enforcer ensures that the provided execution matches exactly
 * with the expected execution (target, value, and calldata).
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the execution.
 * @returns The Caveat.
 * @throws Error if any of the execution parameters are invalid.
 */
export const exactExecutionBuilder = (
  environment: SmartAccountsEnvironment,
  config: ExactExecutionBuilderConfig,
): Caveat => {
  const { execution } = config;

  if (!isAddress(execution.target, { strict: false })) {
    throw new Error('Invalid target: must be a valid address');
  }

  if (execution.value < 0n) {
    throw new Error('Invalid value: must be a non-negative number');
  }

  if (!execution.callData.startsWith('0x')) {
    throw new Error('Invalid calldata: must be a hex string starting with 0x');
  }

  const terms = createExactExecutionTerms({ execution });

  const {
    caveatEnforcers: { ExactExecutionEnforcer },
  } = environment;

  if (!ExactExecutionEnforcer) {
    throw new Error('ExactExecutionEnforcer not found in environment');
  }

  return {
    enforcer: ExactExecutionEnforcer,
    terms,
    args: '0x00',
  };
};
