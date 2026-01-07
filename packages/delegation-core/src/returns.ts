import { type BytesLike, bytesToHex, hexToBytes } from '@metamask/utils';

import type { Hex } from './types';

/**
 * The possible return value types for encoding/decoding operations.
 */
export type ResultValue = 'hex' | 'bytes';

/**
 * Utility type for function return types based on ResultValue.
 */
export type ResultType<TResultValue extends ResultValue> =
  TResultValue extends 'hex' ? Hex : Uint8Array;

/**
 * Base options interface for operations that can return hex or bytes.
 */
export type EncodingOptions<TResultValue extends ResultValue> = {
  out: TResultValue;
};

/**
 * Default options value with proper typing. Use this as your default parameter.
 */
export const defaultOptions = { out: 'hex' } as EncodingOptions<any>;

/**
 * Prepares a result by converting between hex and bytes based on options.
 *
 * @param result - The value to convert (either Uint8Array or Hex optionally prefixed with 0x).
 * @param options - The options specifying the desired output format.
 * @returns The converted value with proper type narrowing.
 */
export function prepareResult<TResultValue extends ResultValue>(
  result: Uint8Array | Hex | string,
  options: EncodingOptions<TResultValue>,
): ResultType<TResultValue> {
  if (options.out === 'hex') {
    const hexValue = typeof result === 'string' ? result : bytesToHex(result);

    return hexValue.startsWith('0x')
      ? (hexValue as ResultType<TResultValue>)
      : (`0x${hexValue}` as ResultType<TResultValue>);
  }
  const bytesValue = result instanceof Uint8Array ? result : hexToBytes(result);
  return bytesValue as ResultType<TResultValue>;
}

/**
 * Converts a bytes-like value to a hex string.
 *
 * @param bytesLike - The bytes-like value to convert.
 * @returns The hex string representation of the bytes-like value.
 */
export const bytesLikeToHex = (bytesLike: BytesLike): Hex => {
  if (typeof bytesLike === 'string') {
    return bytesLike;
  }
  return bytesToHex(bytesLike);
};

/**
 * Converts a bytes-like value to a Uint8Array.
 *
 * @param bytesLike - The bytes-like value to convert.
 * @returns The Uint8Array representation of the bytes-like value.
 */
export const bytesLikeToBytes = (bytesLike: BytesLike): Uint8Array => {
  if (typeof bytesLike === 'string') {
    return hexToBytes(bytesLike);
  }
  return bytesLike;
};
