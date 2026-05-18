import {
  decodeAllowedCalldataTerms,
  decodeERC20StreamingTerms,
  decodeERC20TransferAmountTerms,
  decodeERC20BalanceChangeTerms,
  decodeApprovalRevocationTerms,
  decodeAllowedMethodsTerms,
  decodeAllowedTargetsTerms,
  decodeArgsEqualityCheckTerms,
  decodeBlockNumberTerms,
  decodeDeployedTerms,
  decodeERC721BalanceChangeTerms,
  decodeERC721TransferTerms,
  decodeERC1155BalanceChangeTerms,
  decodeTimestampTerms,
  decodeNonceTerms,
  decodeValueLteTerms,
  decodeLimitedCallsTerms,
  decodeIdTerms,
  decodeNativeTokenTransferAmountTerms,
  decodeNativeBalanceChangeTerms,
  decodeNativeTokenStreamingTerms,
  decodeNativeTokenPaymentTerms,
  decodeRedeemerTerms,
  decodeSpecificActionERC20TransferBatchTerms,
  decodeNativeTokenPeriodTransferTerms,
  decodeERC20TokenPeriodTransferTerms,
  decodeExactExecutionTerms,
  decodeExactCalldataTerms,
  decodeExactCalldataBatchTerms,
  decodeExactExecutionBatchTerms,
  decodeMultiTokenPeriodTerms,
  decodeOwnershipTransferTerms,
} from '@metamask/delegation-core';
import {
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
} from 'viem';

import type { CoreCaveatConfiguration } from './caveatBuilder/coreCaveatBuilder';
import { CaveatType } from './constants';
import type { Caveat, SmartAccountsEnvironment } from './types';

export const CAVEAT_ABI_TYPE_COMPONENTS = [
  { type: 'address', name: 'enforcer' },
  { type: 'bytes', name: 'terms' },
  { type: 'bytes', name: 'args' },
];

export const CAVEAT_TYPEHASH: Hex = keccak256(
  toHex('Caveat(address enforcer,bytes terms)'),
);

/**
 * Calculates the hash of a single Caveat.
 *
 * @param input - The Caveat data.
 * @returns The keccak256 hash of the encoded Caveat packet.
 */
export const getCaveatPacketHash = (input: Caveat): Hex => {
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32'),
    [CAVEAT_TYPEHASH, input.enforcer, keccak256(input.terms)],
  );
  return keccak256(encoded);
};

/**
 * Creates a caveat.
 *
 * @param enforcer - The contract that guarantees the caveat is upheld.
 * @param terms - The data that the enforcer will use to verify the caveat (unique per enforcer).
 * @param args - Additional arguments for the caveat (optional).
 * @returns A Caveat.
 */
export const createCaveat = (
  enforcer: Hex,
  terms: Hex,
  args: Hex = '0x00',
): Caveat => {
  return {
    enforcer,
    terms,
    args,
  };
};

/**
 * Decodes a caveat's encoded `terms` bytes by matching `enforcer` to the known enforcer addresses
 * in the environment, then delegating to the corresponding `delegation-core` decoder.
 *
 * @param params - The caveat to decode and the environment that supplies enforcer contract addresses.
 * @param params.caveat - The on-chain caveat (`enforcer` + ABI-encoded `terms`).
 * @param params.environment - Smart accounts environment, including `caveatEnforcers` address map.
 * @returns A {@link CoreCaveatConfiguration} discriminated by `type`, ready for caveat builders.
 * @throws If `enforcer` is not a known enforcer in `environment.caveatEnforcers`.
 */
export const decodeCaveat = ({
  caveat: { enforcer, terms },
  environment: { caveatEnforcers },
}: {
  caveat: Caveat;
  environment: SmartAccountsEnvironment;
}): CoreCaveatConfiguration => {
  switch (enforcer.toLowerCase()) {
    case caveatEnforcers.AllowedCalldataEnforcer?.toLowerCase():
      return {
        type: CaveatType.AllowedCalldata,
        ...decodeAllowedCalldataTerms(terms),
      };
    case caveatEnforcers.AllowedMethodsEnforcer?.toLowerCase():
      return {
        type: CaveatType.AllowedMethods,
        ...decodeAllowedMethodsTerms(terms),
      };
    case caveatEnforcers.ApprovalRevocationEnforcer?.toLowerCase():
      return {
        type: CaveatType.ApprovalRevocation,
        ...decodeApprovalRevocationTerms(terms),
      };
    case caveatEnforcers.AllowedTargetsEnforcer?.toLowerCase():
      return {
        type: CaveatType.AllowedTargets,
        ...decodeAllowedTargetsTerms(terms),
      };
    case caveatEnforcers.ArgsEqualityCheckEnforcer?.toLowerCase():
      return {
        type: CaveatType.ArgsEqualityCheck,
        ...decodeArgsEqualityCheckTerms(terms),
      };
    case caveatEnforcers.BlockNumberEnforcer?.toLowerCase():
      return { type: CaveatType.BlockNumber, ...decodeBlockNumberTerms(terms) };
    case caveatEnforcers.DeployedEnforcer?.toLowerCase():
      return { type: CaveatType.Deployed, ...decodeDeployedTerms(terms) };
    case caveatEnforcers.ERC20BalanceChangeEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc20BalanceChange,
        ...decodeERC20BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC20TransferAmountEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc20TransferAmount,
        ...decodeERC20TransferAmountTerms(terms),
      };
    case caveatEnforcers.ERC20StreamingEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc20Streaming,
        ...decodeERC20StreamingTerms(terms),
      };
    case caveatEnforcers.ERC721BalanceChangeEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc721BalanceChange,
        ...decodeERC721BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC721TransferEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc721Transfer,
        ...decodeERC721TransferTerms(terms),
      };
    case caveatEnforcers.ERC1155BalanceChangeEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc1155BalanceChange,
        ...decodeERC1155BalanceChangeTerms(terms),
      };
    case caveatEnforcers.IdEnforcer?.toLowerCase():
      return { type: CaveatType.Id, ...decodeIdTerms(terms) };
    case caveatEnforcers.LimitedCallsEnforcer?.toLowerCase():
      return {
        type: CaveatType.LimitedCalls,
        ...decodeLimitedCallsTerms(terms),
      };
    case caveatEnforcers.NonceEnforcer?.toLowerCase():
      return { type: CaveatType.Nonce, ...decodeNonceTerms(terms) };
    case caveatEnforcers.TimestampEnforcer?.toLowerCase():
      return { type: CaveatType.Timestamp, ...decodeTimestampTerms(terms) };
    case caveatEnforcers.ValueLteEnforcer?.toLowerCase():
      return { type: CaveatType.ValueLte, ...decodeValueLteTerms(terms) };
    case caveatEnforcers.NativeTokenTransferAmountEnforcer?.toLowerCase():
      return {
        type: CaveatType.NativeTokenTransferAmount,
        ...decodeNativeTokenTransferAmountTerms(terms),
      };
    case caveatEnforcers.NativeBalanceChangeEnforcer?.toLowerCase():
      return {
        type: CaveatType.NativeBalanceChange,
        ...decodeNativeBalanceChangeTerms(terms),
      };
    case caveatEnforcers.NativeTokenStreamingEnforcer?.toLowerCase():
      return {
        type: CaveatType.NativeTokenStreaming,
        ...decodeNativeTokenStreamingTerms(terms),
      };
    case caveatEnforcers.NativeTokenPaymentEnforcer?.toLowerCase():
      return {
        type: CaveatType.NativeTokenPayment,
        ...decodeNativeTokenPaymentTerms(terms),
      };
    case caveatEnforcers.RedeemerEnforcer?.toLowerCase():
      return { type: CaveatType.Redeemer, ...decodeRedeemerTerms(terms) };
    case caveatEnforcers.SpecificActionERC20TransferBatchEnforcer?.toLowerCase():
      return {
        type: CaveatType.SpecificActionERC20TransferBatch,
        ...decodeSpecificActionERC20TransferBatchTerms(terms),
      };
    case caveatEnforcers.ERC20PeriodTransferEnforcer?.toLowerCase():
      return {
        type: CaveatType.Erc20PeriodTransfer,
        ...decodeERC20TokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.NativeTokenPeriodTransferEnforcer?.toLowerCase():
      return {
        type: CaveatType.NativeTokenPeriodTransfer,
        ...decodeNativeTokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.ExactCalldataBatchEnforcer?.toLowerCase():
      return {
        type: CaveatType.ExactCalldataBatch,
        ...decodeExactCalldataBatchTerms(terms),
      };
    case caveatEnforcers.ExactCalldataEnforcer?.toLowerCase():
      return {
        type: CaveatType.ExactCalldata,
        ...decodeExactCalldataTerms(terms),
      };
    case caveatEnforcers.ExactExecutionEnforcer?.toLowerCase():
      return {
        type: CaveatType.ExactExecution,
        ...decodeExactExecutionTerms(terms),
      };
    case caveatEnforcers.ExactExecutionBatchEnforcer?.toLowerCase():
      return {
        type: CaveatType.ExactExecutionBatch,
        ...decodeExactExecutionBatchTerms(terms),
      };
    case caveatEnforcers.MultiTokenPeriodEnforcer?.toLowerCase():
      return {
        type: CaveatType.MultiTokenPeriod,
        ...decodeMultiTokenPeriodTerms(terms),
      };
    case caveatEnforcers.OwnershipTransferEnforcer?.toLowerCase():
      return {
        type: CaveatType.OwnershipTransfer,
        ...decodeOwnershipTransferTerms(terms),
      };
    default:
      throw new Error(`Unknown enforcer address: ${enforcer}`);
  }
};
