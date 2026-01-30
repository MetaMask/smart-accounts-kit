import { createExactExecutionBatchTerms } from '@metamask/delegation-core';
import { isAddress } from 'viem';

import type { ExecutionStruct } from '../executions';
import type { Caveat, SmartAccountsEnvironment } from '../types';

export const exactExecutionBatch = 'exactExecutionBatch';

export type ExactExecutionBatchBuilderConfig = {
  /**
   * An array of executions that must be matched exactly in the batch.
   * Each execution specifies a target address, value, and calldata.
   */
  executions: ExecutionStruct[];
};

/**
 * Builds a caveat struct for ExactExecutionBatchEnforcer.
 * This enforcer ensures that each execution in the batch matches exactly
 * with the expected execution (target, value, and calldata).
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing executions.
 * @returns The Caveat.
 * @throws Error if any of the execution parameters are invalid.
 */
export const exactExecutionBatchBuilder = (
  environment: SmartAccountsEnvironment,
  config: ExactExecutionBatchBuilderConfig,
): Caveat => {
  const { executions } = config;

  if (executions.length === 0) {
    throw new Error('Invalid executions: array cannot be empty');
  }

  // Validate each execution
  for (const execution of executions) {
    if (!isAddress(execution.target, { strict: false })) {
      throw new Error('Invalid target: must be a valid address');
    }

    if (execution.value < 0n) {
      throw new Error('Invalid value: must be a non-negative number');
    }

    if (!execution.callData.startsWith('0x')) {
      throw new Error(
        'Invalid calldata: must be a hex string starting with 0x',
      );
    }
  }

  const terms = createExactExecutionBatchTerms({ executions });

  const {
    caveatEnforcers: { ExactExecutionBatchEnforcer },
  } = environment;

  if (!ExactExecutionBatchEnforcer) {
    throw new Error('ExactExecutionBatchEnforcer not found in environment');
  }

  return {
    enforcer: ExactExecutionBatchEnforcer,
    terms,
    args: '0x00',
  };
};
