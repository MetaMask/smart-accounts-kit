import {
  BaseError,
  ContractFunctionRevertedError,
  encodeErrorResult,
} from 'viem';
import { describe, expect, it } from 'vitest';

import { decodeRevertReason } from '../src/decodeRevertReason';

describe('decodeRevertReason', () => {
  it('should decode viem contract function reverted errors', () => {
    const abi = [
      {
        type: 'error',
        name: 'Error',
        inputs: [{ name: 'message', type: 'string' }],
      },
    ] as const;
    const rawData = encodeErrorResult({
      abi,
      errorName: 'Error',
      args: ['AllowedMethodsEnforcer:method-not-allowed'],
    });
    const revertError = new ContractFunctionRevertedError({
      abi,
      data: rawData,
      functionName: 'redeemDelegations',
    });
    const executionError = new BaseError('Transaction simulation failed.', {
      cause: revertError,
    });

    expect(decodeRevertReason(executionError)).toStrictEqual({
      errorName: 'Error',
      message: 'AllowedMethodsEnforcer:method-not-allowed',
      rawData,
    });
  });
});
