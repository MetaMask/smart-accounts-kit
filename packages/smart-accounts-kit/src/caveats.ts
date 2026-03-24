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
  switch (enforcer) {
    case caveatEnforcers.AllowedCalldataEnforcer:
      return { type: 'allowedCalldata', ...decodeAllowedCalldataTerms(terms) };
    case caveatEnforcers.AllowedMethodsEnforcer:
      return { type: 'allowedMethods', ...decodeAllowedMethodsTerms(terms) };
    case caveatEnforcers.AllowedTargetsEnforcer:
      return { type: 'allowedTargets', ...decodeAllowedTargetsTerms(terms) };
    case caveatEnforcers.ArgsEqualityCheckEnforcer:
      return {
        type: 'argsEqualityCheck',
        ...decodeArgsEqualityCheckTerms(terms),
      };
    case caveatEnforcers.BlockNumberEnforcer:
      return { type: 'blockNumber', ...decodeBlockNumberTerms(terms) };
    case caveatEnforcers.DeployedEnforcer:
      return { type: 'deployed', ...decodeDeployedTerms(terms) };
    case caveatEnforcers.ERC20BalanceChangeEnforcer:
      return {
        type: 'erc20BalanceChange',
        ...decodeERC20BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC20TransferAmountEnforcer:
      return {
        type: 'erc20TransferAmount',
        ...decodeERC20TransferAmountTerms(terms),
      };
    case caveatEnforcers.ERC20StreamingEnforcer:
      return { type: 'erc20Streaming', ...decodeERC20StreamingTerms(terms) };
    case caveatEnforcers.ERC721BalanceChangeEnforcer:
      return {
        type: 'erc721BalanceChange',
        ...decodeERC721BalanceChangeTerms(terms),
      };
    case caveatEnforcers.ERC721TransferEnforcer:
      return { type: 'erc721Transfer', ...decodeERC721TransferTerms(terms) };
    case caveatEnforcers.ERC1155BalanceChangeEnforcer:
      return {
        type: 'erc1155BalanceChange',
        ...decodeERC1155BalanceChangeTerms(terms),
      };
    case caveatEnforcers.IdEnforcer:
      return { type: 'id', ...decodeIdTerms(terms) };
    case caveatEnforcers.LimitedCallsEnforcer:
      return { type: 'limitedCalls', ...decodeLimitedCallsTerms(terms) };
    case caveatEnforcers.NonceEnforcer:
      return { type: 'nonce', ...decodeNonceTerms(terms) };
    case caveatEnforcers.TimestampEnforcer:
      return { type: 'timestamp', ...decodeTimestampTerms(terms) };
    case caveatEnforcers.ValueLteEnforcer:
      return { type: 'valueLte', ...decodeValueLteTerms(terms) };
    case caveatEnforcers.NativeTokenTransferAmountEnforcer:
      return {
        type: 'nativeTokenTransferAmount',
        ...decodeNativeTokenTransferAmountTerms(terms),
      };
    case caveatEnforcers.NativeBalanceChangeEnforcer:
      return {
        type: 'nativeBalanceChange',
        ...decodeNativeBalanceChangeTerms(terms),
      };
    case caveatEnforcers.NativeTokenStreamingEnforcer:
      return {
        type: 'nativeTokenStreaming',
        ...decodeNativeTokenStreamingTerms(terms),
      };
    case caveatEnforcers.NativeTokenPaymentEnforcer:
      return {
        type: 'nativeTokenPayment',
        ...decodeNativeTokenPaymentTerms(terms),
      };
    case caveatEnforcers.RedeemerEnforcer:
      return { type: 'redeemer', ...decodeRedeemerTerms(terms) };
    case caveatEnforcers.SpecificActionERC20TransferBatchEnforcer:
      return {
        type: 'specificActionERC20TransferBatch',
        ...decodeSpecificActionERC20TransferBatchTerms(terms),
      };
    case caveatEnforcers.ERC20PeriodTransferEnforcer:
      return {
        type: 'erc20PeriodTransfer',
        ...decodeERC20TokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.NativeTokenPeriodTransferEnforcer:
      return {
        type: 'nativeTokenPeriodTransfer',
        ...decodeNativeTokenPeriodTransferTerms(terms),
      };
    case caveatEnforcers.ExactCalldataBatchEnforcer:
      return {
        type: 'exactCalldataBatch',
        ...decodeExactCalldataBatchTerms(terms),
      };
    case caveatEnforcers.ExactCalldataEnforcer:
      return { type: 'exactCalldata', ...decodeExactCalldataTerms(terms) };
    case caveatEnforcers.ExactExecutionEnforcer:
      return { type: 'exactExecution', ...decodeExactExecutionTerms(terms) };
    case caveatEnforcers.ExactExecutionBatchEnforcer:
      return {
        type: 'exactExecutionBatch',
        ...decodeExactExecutionBatchTerms(terms),
      };
    case caveatEnforcers.MultiTokenPeriodEnforcer:
      return {
        type: 'multiTokenPeriod',
        ...decodeMultiTokenPeriodTerms(terms),
      };
    case caveatEnforcers.OwnershipTransferEnforcer:
      return {
        type: 'ownershipTransfer',
        ...decodeOwnershipTransferTerms(terms),
      };
    default:
      throw new Error(`Unknown enforcer address: ${enforcer}`);
  }
};
