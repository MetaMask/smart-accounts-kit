import {
  decodeAllowedCalldataTerms,
  decodeERC20StreamingTerms,
  decodeERC20TransferAmountTerms,
  decodeERC20BalanceChangeTerms,
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
): Caveat => ({
  enforcer,
  terms,
  args,
});

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
      return { type: 'allowedCalldata', ...decodeAllowedCalldataTerms(terms) };
    case caveatEnforcers.AllowedMethodsEnforcer?.toLowerCase():
      return { type: 'allowedMethods', ...decodeAllowedMethodsTerms(terms) };
    case caveatEnforcers.AllowedTargetsEnforcer?.toLowerCase():
      return { type: 'allowedTargets', ...decodeAllowedTargetsTerms(terms) };
    case caveatEnforcers.ArgsEqualityCheckEnforcer?.toLowerCase():
      return {
        type: 'argsEqualityCheck',
        ...decodeArgsEqualityCheckTerms(terms),
      };
    case caveatEnforcers.BlockNumberEnforcer?.toLowerCase():
      return { type: 'blockNumber', ...decodeBlockNumberTerms(terms) };
    case caveatEnforcers.DeployedEnforcer?.toLowerCase():
      return { type: 'deployed', ...decodeDeployedTerms(terms) };
    case caveatEnforcers.ERC20BalanceChangeEnforcer?.toLowerCase():
      return {
        type: 'erc20BalanceChange',
        ...decodeERC20BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC20TransferAmountEnforcer?.toLowerCase():
      return {
        type: 'erc20TransferAmount',
        ...decodeERC20TransferAmountTerms(terms),
      };
    case caveatEnforcers.ERC20StreamingEnforcer?.toLowerCase():
      return { type: 'erc20Streaming', ...decodeERC20StreamingTerms(terms) };
    case caveatEnforcers.ERC721BalanceChangeEnforcer?.toLowerCase():
      return {
        type: 'erc721BalanceChange',
        ...decodeERC721BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC721TransferEnforcer?.toLowerCase():
      return { type: 'erc721Transfer', ...decodeERC721TransferTerms(terms) };
    case caveatEnforcers.ERC1155BalanceChangeEnforcer?.toLowerCase():
      return {
        type: 'erc1155BalanceChange',
        ...decodeERC1155BalanceChangeTerms(terms),
      };
    case caveatEnforcers.IdEnforcer?.toLowerCase():
      return { type: 'id', ...decodeIdTerms(terms) };
    case caveatEnforcers.LimitedCallsEnforcer?.toLowerCase():
      return { type: 'limitedCalls', ...decodeLimitedCallsTerms(terms) };
    case caveatEnforcers.NonceEnforcer?.toLowerCase():
      return { type: 'nonce', ...decodeNonceTerms(terms) };
    case caveatEnforcers.TimestampEnforcer?.toLowerCase():
      return { type: 'timestamp', ...decodeTimestampTerms(terms) };
    case caveatEnforcers.ValueLteEnforcer?.toLowerCase():
      return { type: 'valueLte', ...decodeValueLteTerms(terms) };
    case caveatEnforcers.NativeTokenTransferAmountEnforcer?.toLowerCase():
      return {
        type: 'nativeTokenTransferAmount',
        ...decodeNativeTokenTransferAmountTerms(terms),
      };
    case caveatEnforcers.NativeBalanceChangeEnforcer?.toLowerCase():
      return {
        type: 'nativeBalanceChange',
        ...decodeNativeBalanceChangeTerms(terms),
      };
    case caveatEnforcers.NativeTokenStreamingEnforcer?.toLowerCase():
      return {
        type: 'nativeTokenStreaming',
        ...decodeNativeTokenStreamingTerms(terms),
      };
    case caveatEnforcers.NativeTokenPaymentEnforcer?.toLowerCase():
      return {
        type: 'nativeTokenPayment',
        ...decodeNativeTokenPaymentTerms(terms),
      };
    case caveatEnforcers.RedeemerEnforcer?.toLowerCase():
      return { type: 'redeemer', ...decodeRedeemerTerms(terms) };
    case caveatEnforcers.SpecificActionERC20TransferBatchEnforcer?.toLowerCase():
      return {
        type: 'specificActionERC20TransferBatch',
        ...decodeSpecificActionERC20TransferBatchTerms(terms),
      };
    case caveatEnforcers.ERC20PeriodTransferEnforcer?.toLowerCase():
      return {
        type: 'erc20PeriodTransfer',
        ...decodeERC20TokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.NativeTokenPeriodTransferEnforcer?.toLowerCase():
      return {
        type: 'nativeTokenPeriodTransfer',
        ...decodeNativeTokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.ExactCalldataBatchEnforcer?.toLowerCase():
      return {
        type: 'exactCalldataBatch',
        ...decodeExactCalldataBatchTerms(terms),
      };
    case caveatEnforcers.ExactCalldataEnforcer?.toLowerCase():
      return { type: 'exactCalldata', ...decodeExactCalldataTerms(terms) };
    case caveatEnforcers.ExactExecutionEnforcer?.toLowerCase():
      return { type: 'exactExecution', ...decodeExactExecutionTerms(terms) };
    case caveatEnforcers.ExactExecutionBatchEnforcer?.toLowerCase():
      return {
        type: 'exactExecutionBatch',
        ...decodeExactExecutionBatchTerms(terms),
      };
    case caveatEnforcers.MultiTokenPeriodEnforcer?.toLowerCase():
      return {
        type: 'multiTokenPeriod',
        ...decodeMultiTokenPeriodTerms(terms),
      };
    case caveatEnforcers.OwnershipTransferEnforcer?.toLowerCase():
      return {
        type: 'ownershipTransfer',
        ...decodeOwnershipTransferTerms(terms),
      };
    default:
      throw new Error(`Unknown enforcer address: ${enforcer}`);
  }
};
