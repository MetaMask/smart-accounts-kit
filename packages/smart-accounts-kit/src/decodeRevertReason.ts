import * as delegationAbis from '@metamask/delegation-abis';
import { BaseError, ContractFunctionRevertedError, isHex } from 'viem';
import type { Abi, AbiItem, Hex } from 'viem';
import { decodeErrorResult, formatAbiItemWithArgs } from 'viem/utils';

const knownRevertAbis = (Object.values(delegationAbis) as Abi[]).filter(
  (abi) => abi.length > 0,
);

// viem decodes standard Solidity Error(string) and Panic(uint256) with an empty ABI.
const standardSolidityErrorAbi: Abi = [] as const;
const revertReasonAbis: readonly Abi[] = [
  standardSolidityErrorAbi,
  ...knownRevertAbis,
];

const MAX_ERROR_TRAVERSAL_DEPTH = 8;

const panicReasons: Record<string, string> = {
  '1': 'An `assert` condition failed.',
  '17': 'Arithmetic operation resulted in underflow or overflow.',
  '18': 'Division or modulo by zero.',
  '33': 'Attempted to convert to an invalid type.',
  '34': 'Attempted to access a storage byte array that is incorrectly encoded.',
  '49': 'Performed `.pop()` on an empty array.',
  '50': 'Array index is out of bounds.',
  '65': 'Allocated too much memory or created an array which is too large.',
  '81': 'Attempted to call a zero-initialized variable of internal function type.',
};

export type DecodedRevertReason = {
  readonly errorName: string;
  readonly message: string;
  readonly rawData: Hex;
};

/**
 * Decodes the first recognized revert data candidate in an error chain.
 *
 * @param error - The original error thrown by viem or an RPC provider.
 * @returns A decoded revert reason, if one can be recognized.
 */
export function decodeRevertReason(
  error: unknown,
): DecodedRevertReason | undefined {
  const decodedViemError = decodeViemContractRevert(error);

  if (decodedViemError) {
    return decodedViemError;
  }

  for (const rawData of getRevertDataCandidates(error)) {
    const decoded = decodeRevertData(rawData);

    if (decoded) {
      return decoded;
    }
  }

  return undefined;
}

/**
 * Extracts revert information that viem has already identified in its error
 * chain before falling back to provider-specific string/object shapes.
 *
 * @param error - The original error thrown by viem.
 * @returns A decoded revert reason, if viem exposed enough revert data.
 */
function decodeViemContractRevert(
  error: unknown,
): DecodedRevertReason | undefined {
  if (!(error instanceof BaseError)) {
    return undefined;
  }

  const revertError = error.walk(
    (cause) => cause instanceof ContractFunctionRevertedError,
  );

  if (!(revertError instanceof ContractFunctionRevertedError)) {
    return undefined;
  }

  if (!revertError.raw) {
    return undefined;
  }

  if (revertError.data) {
    const { abiItem, args, errorName } = revertError.data;
    return {
      errorName,
      message: formatDecodedError(errorName, args, abiItem),
      rawData: revertError.raw,
    };
  }

  return decodeRevertData(revertError.raw);
}

/**
 * Decodes raw revert data against standard Solidity errors and known SDK ABIs.
 *
 * @param rawData - ABI-encoded revert data.
 * @returns A decoded revert reason, if the data matches a known error.
 */
export function decodeRevertData(
  rawData: Hex,
): DecodedRevertReason | undefined {
  for (const abi of revertReasonAbis) {
    try {
      const { abiItem, args, errorName } = decodeErrorResult({
        abi,
        data: rawData,
      });

      return {
        errorName,
        message: formatDecodedError(errorName, args, abiItem),
        rawData,
      };
    } catch {
      // Try the next ABI until one can decode the revert data.
    }
  }

  const decodedString = decodeRawString(rawData);

  if (decodedString) {
    return {
      errorName: 'Error',
      message: decodedString,
      rawData,
    };
  }

  return undefined;
}

/**
 * Formats a decoded error into compact user-facing text.
 *
 * @param errorName - The decoded Solidity error name.
 * @param args - The decoded Solidity error arguments.
 * @param abiItem - The ABI item used to decode the error.
 * @returns Human-readable revert text.
 */
function formatDecodedError(
  errorName: string,
  args: readonly unknown[] | undefined,
  abiItem: AbiItem,
): string {
  const [firstArg] = args ?? [];

  if (errorName === 'Error') {
    return typeof firstArg === 'string' ? firstArg : errorName;
  }

  if (errorName === 'Panic') {
    const panicCode = String(firstArg);
    return panicReasons[panicCode] ?? `Panic(${panicCode})`;
  }

  const formattedArgs = formatAbiItemWithArgs({
    abiItem,
    args: args ?? [],
    includeFunctionName: false,
    includeName: false,
  });

  return `${errorName}${formattedArgs ?? ''}`;
}

/**
 * Decodes revert payloads surfaced by some clients as raw printable ASCII bytes.
 *
 * @param rawData - Hex-encoded bytes that may represent a printable ASCII string.
 * @returns The decoded string when it looks like readable text.
 */
function decodeRawString(rawData: Hex): string | undefined {
  const bytes = rawData.slice(2);

  if (bytes.length === 0 || bytes.length % 2 !== 0) {
    return undefined;
  }

  let value = '';

  for (let index = 0; index < bytes.length; index += 2) {
    const charCode = Number.parseInt(bytes.slice(index, index + 2), 16);

    if (Number.isNaN(charCode) || charCode < 0x20 || charCode > 0x7e) {
      return undefined;
    }

    value += String.fromCharCode(charCode);
  }

  return value;
}

/**
 * Extracts hex revert data candidates from common viem and JSON-RPC error shapes.
 *
 * @param error - The error object to inspect.
 * @returns Candidate revert data values.
 */
function getRevertDataCandidates(error: unknown): Hex[] {
  const candidates: Hex[] = [];
  const seen = new Set<unknown>();
  const seenCandidates = new Set<Hex>();

  const addHexCandidate = (candidate: string): void => {
    if (
      candidate.length < 10 ||
      candidate.length % 2 !== 0 ||
      !isHex(candidate)
    ) {
      return;
    }

    if (!seenCandidates.has(candidate)) {
      seenCandidates.add(candidate);
      candidates.push(candidate);
    }
  };

  const addLabeledHexCandidates = (value: string): void => {
    for (const match of value.matchAll(
      /\b(?:reason|revertData|raw|data):\s*(0x[0-9a-fA-F]+)/giu,
    )) {
      const [, candidate] = match;

      if (candidate) {
        addHexCandidate(candidate);
      }
    }
  };

  const addHexCandidates = (value: unknown): void => {
    if (typeof value !== 'string') {
      return;
    }

    addLabeledHexCandidates(value);

    for (const [candidate] of value.matchAll(/0x[0-9a-fA-F]+/gu)) {
      addHexCandidate(candidate);
    }
  };

  const visit = (value: unknown, depth = 0): void => {
    if (
      value === null ||
      value === undefined ||
      seen.has(value) ||
      depth > MAX_ERROR_TRAVERSAL_DEPTH
    ) {
      return;
    }

    addHexCandidates(value);

    if (Array.isArray(value)) {
      seen.add(value);
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    seen.add(value);

    const record = value as Record<string, unknown>;

    addHexCandidates(record.revertData);
    addHexCandidates(record.raw);
    addHexCandidates(record.data);
    addHexCandidates(record.details);
    addHexCandidates(record.reason);
    addHexCandidates(record.shortMessage);
    addHexCandidates(record.message);

    visit(record.data, depth + 1);
    visit(record.details, depth + 1);
    visit(record.error, depth + 1);
    visit(record.metaMessages, depth + 1);
    visit(record.originalError, depth + 1);
    visit(record.cause, depth + 1);
  };

  visit(error);

  return candidates;
}
