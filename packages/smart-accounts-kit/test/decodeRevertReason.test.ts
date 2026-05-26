import * as delegationAbis from '@metamask/delegation-abis';
import {
  BaseError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  stringToHex,
} from 'viem';
import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import {
  decodeRevertData,
  decodeRevertReason,
} from '../src/decodeRevertReason';

describe('decodeRevertReason', () => {
  describe('viem BaseError chain', () => {
    it('should decode a ContractFunctionRevertedError with Error(string)', () => {
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

  describe('raw hex extraction from error messages', () => {
    it('should decode revert data embedded in a plain Error message', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Error',
            inputs: [{ name: 'message', type: 'string' }],
          },
        ],
        errorName: 'Error',
        args: ['some-revert-reason'],
      });
      const error = new Error(`Execution reverted with data: ${rawData}`);

      expect(decodeRevertReason(error)).toStrictEqual({
        errorName: 'Error',
        message: 'some-revert-reason',
        rawData,
      });
    });

    it('should extract hex from labeled fields like reason: and data:', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Error',
            inputs: [{ name: 'message', type: 'string' }],
          },
        ],
        errorName: 'Error',
        args: ['test-reason'],
      });
      const error = new Error(`Details: reason: ${rawData}`);

      expect(decodeRevertReason(error)).toStrictEqual({
        errorName: 'Error',
        message: 'test-reason',
        rawData,
      });
    });

    it('should extract hex from nested error objects', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Error',
            inputs: [{ name: 'message', type: 'string' }],
          },
        ],
        errorName: 'Error',
        args: ['nested-reason'],
      });
      const error = { cause: { data: rawData as string } };

      expect(decodeRevertReason(error)).toStrictEqual({
        errorName: 'Error',
        message: 'nested-reason',
        rawData,
      });
    });
  });

  describe('non-decodable inputs', () => {
    it('should return undefined for null', () => {
      expect(decodeRevertReason(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(decodeRevertReason(undefined)).toBeUndefined();
    });

    it('should return undefined for a number', () => {
      expect(decodeRevertReason(42)).toBeUndefined();
    });

    it('should return undefined for a plain string without hex', () => {
      expect(decodeRevertReason('just a string')).toBeUndefined();
    });

    it('should return undefined for an Error without hex data', () => {
      expect(
        decodeRevertReason(new Error('Something went wrong')),
      ).toBeUndefined();
    });
  });
});

describe('decodeRevertData', () => {
  describe('standard Solidity errors', () => {
    it('should decode Error(string)', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Error',
            inputs: [{ name: 'message', type: 'string' }],
          },
        ],
        errorName: 'Error',
        args: ['AllowedTargetsEnforcer:target-address-not-allowed'],
      });

      expect(decodeRevertData(rawData)).toStrictEqual({
        errorName: 'Error',
        message: 'AllowedTargetsEnforcer:target-address-not-allowed',
        rawData,
      });
    });

    it('should decode Panic(uint256) with a known code', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Panic',
            inputs: [{ name: 'code', type: 'uint256' }],
          },
        ],
        errorName: 'Panic',
        args: [17n],
      });

      expect(decodeRevertData(rawData)).toStrictEqual({
        errorName: 'Panic',
        message: 'Arithmetic operation resulted in underflow or overflow.',
        rawData,
      });
    });

    it('should decode Panic(uint256) with an unknown code', () => {
      const rawData = encodeErrorResult({
        abi: [
          {
            type: 'error',
            name: 'Panic',
            inputs: [{ name: 'code', type: 'uint256' }],
          },
        ],
        errorName: 'Panic',
        args: [999n],
      });

      expect(decodeRevertData(rawData)).toStrictEqual({
        errorName: 'Panic',
        message: 'Panic(999)',
        rawData,
      });
    });
  });

  describe('delegation framework errors', () => {
    it('should decode a no-arg delegation error (FailedInnerCall)', () => {
      const rawData = encodeErrorResult({
        abi: delegationAbis.Address,
        errorName: 'FailedInnerCall',
      });

      const result = decodeRevertData(rawData);
      expect(result).toBeDefined();
      expect(result?.errorName).toBe('FailedInnerCall');
    });

    it('should decode a delegation error with arguments (Create2InsufficientBalance)', () => {
      const rawData = encodeErrorResult({
        abi: delegationAbis.Create2,
        errorName: 'Create2InsufficientBalance',
        args: [100n, 200n],
      });

      const result = decodeRevertData(rawData);
      expect(result).toBeDefined();
      expect(result?.errorName).toBe('Create2InsufficientBalance');
      expect(result?.message).toContain('Create2InsufficientBalance');
      expect(result?.rawData).toBe(rawData);
    });

    it('should decode ExecutionFailed from DeleGatorCore', () => {
      const rawData = encodeErrorResult({
        abi: delegationAbis.DeleGatorCore,
        errorName: 'ExecutionFailed',
      });

      const result = decodeRevertData(rawData);
      expect(result).toBeDefined();
      expect(result?.errorName).toBe('ExecutionFailed');
    });
  });

  describe('raw printable ASCII fallback', () => {
    it('should decode printable ASCII hex bytes', () => {
      const rawData = stringToHex('Hello');

      expect(decodeRevertData(rawData)).toStrictEqual({
        errorName: 'Error',
        message: 'Hello',
        rawData,
      });
    });

    it('should return undefined for hex with non-printable bytes', () => {
      const rawData = '0x0001' as Hex;

      expect(decodeRevertData(rawData)).toBeUndefined();
    });

    it('should return undefined for empty hex', () => {
      expect(decodeRevertData('0x' as Hex)).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should return undefined for hex too short to be a selector', () => {
      expect(decodeRevertData('0xabcd' as Hex)).toBeUndefined();
    });

    it('should return undefined for unrecognized ABI-encoded data', () => {
      expect(
        decodeRevertData('0xdeadbeefdeadbeefdeadbeefdeadbeef' as Hex),
      ).toBeUndefined();
    });
  });
});
