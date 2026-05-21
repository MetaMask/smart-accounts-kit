import * as delegationAbis from '@metamask/delegation-abis';
import { isHex } from 'viem';
import type { Abi, AbiItem, Hex } from 'viem';
import { decodeErrorResult, formatAbiItemWithArgs } from 'viem/utils';

const knownRevertAbis = Object.values(delegationAbis) as readonly Abi[];

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

type DecodedRevertReason = {
  errorName: string;
  message: string;
  rawData: Hex;
};

class RevertReasonError extends Error {
  decodedErrorName: string;

  rawData: Hex;

  constructor(
    action: string,
    decodedReason: DecodedRevertReason,
    cause: Error,
  ) {
    super(`${action} reverted: ${decodedReason.message}`, { cause });
    this.name = 'RevertReasonError';
    this.decodedErrorName = decodedReason.errorName;
    this.rawData = decodedReason.rawData;
  }
}

/**
 * Re-wraps errors with decoded revert data while keeping the message concise.
 *
 * @param error - The original error thrown by viem or an RPC provider.
 * @param action - The action name to include in the generated error.
 * @returns The original error when no human-readable revert reason is found.
 */
export function surfaceRevertReason(error: unknown, action: string): unknown {
  const decodedReason = getDecodedRevertReason(error);

  if (!decodedReason) {
    return error;
  }

  const cause = error instanceof Error ? error : new Error(String(error));

  return new RevertReasonError(action, decodedReason, cause);
}

/**
 * Decodes the first recognized revert data candidate in an error chain.
 *
 * @param error - The error object to inspect.
 * @returns A decoded revert reason, if one can be recognized.
 */
function getDecodedRevertReason(
  error: unknown,
): DecodedRevertReason | undefined {
  for (const rawData of getRevertDataCandidates(error)) {
    const decoded = decodeRevertData(rawData);

    if (decoded) {
      return decoded;
    }
  }

  return undefined;
}

/**
 * Decodes raw revert data against standard Solidity errors and known SDK ABIs.
 *
 * @param rawData - ABI-encoded revert data.
 * @returns A decoded revert reason, if the data matches a known error.
 */
function decodeRevertData(rawData: Hex): DecodedRevertReason | undefined {
  const abis = [[] as const, ...knownRevertAbis];

  for (const abi of abis) {
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
  if (errorName === 'Error') {
    const [reason] = args ?? [];
    return typeof reason === 'string' ? reason : errorName;
  }

  if (errorName === 'Panic') {
    const [code] = args ?? [];
    const panicCode = String(code);
    return panicReasons[panicCode] ?? `Panic(${panicCode})`;
  }

  const formattedArgs = formatAbiItemWithArgs({
    abiItem,
    args: args ?? [],
    includeFunctionName: false,
    includeName: false,
  });

  return `${errorName}${formattedArgs}`;
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
      /(?:reason|revertData|raw|data):\s*(0x[0-9a-fA-F]+)/giu,
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
    if (value === null || value === undefined || seen.has(value) || depth > 8) {
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
    addHexCandidates(record.shortMessage);
    addHexCandidates(record.message);

    visit(record.data, depth + 1);
    visit(record.error, depth + 1);
    visit(record.originalError, depth + 1);
    visit(record.cause, depth + 1);
  };

  visit(error);

  return candidates;
}
