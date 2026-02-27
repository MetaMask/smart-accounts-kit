import type { SmartAccountsEnvironment } from '../types';
import {
  allowedCalldata,
  allowedCalldataBuilder,
} from './allowedCalldataBuilder';
import { allowedMethods, allowedMethodsBuilder } from './allowedMethodsBuilder';
import { allowedTargets, allowedTargetsBuilder } from './allowedTargetsBuilder';
import {
  argsEqualityCheck,
  argsEqualityCheckBuilder,
} from './argsEqualityCheckBuilder';
import { blockNumber, blockNumberBuilder } from './blockNumberBuilder';
import type { CaveatBuilderConfig } from './caveatBuilder';
import { CaveatBuilder } from './caveatBuilder';
import type { CaveatType } from './caveatType';
import { deployed, deployedBuilder } from './deployedBuilder';
import {
  erc1155BalanceChange,
  erc1155BalanceChangeBuilder,
} from './erc1155BalanceChangeBuilder';
import {
  erc20BalanceChange,
  erc20BalanceChangeBuilder,
} from './erc20BalanceChangeBuilder';
import {
  erc20PeriodTransfer,
  erc20PeriodTransferBuilder,
} from './erc20PeriodTransferBuilder';
import { erc20Streaming, erc20StreamingBuilder } from './erc20StreamingBuilder';
import {
  erc20TransferAmount,
  erc20TransferAmountBuilder,
} from './erc20TransferAmountBuilder';
import {
  erc721BalanceChange,
  erc721BalanceChangeBuilder,
} from './erc721BalanceChangeBuilder';
import { erc721Transfer, erc721TransferBuilder } from './erc721TransferBuilder';
import {
  exactCalldataBatch,
  exactCalldataBatchBuilder,
} from './exactCalldataBatchBuilder';
import { exactCalldata, exactCalldataBuilder } from './exactCalldataBuilder';
import {
  exactExecutionBatch,
  exactExecutionBatchBuilder,
} from './exactExecutionBatchBuilder';
import { exactExecution, exactExecutionBuilder } from './exactExecutionBuilder';
import { id, idBuilder } from './idBuilder';
import { limitedCalls, limitedCallsBuilder } from './limitedCallsBuilder';
import {
  multiTokenPeriod,
  multiTokenPeriodBuilder,
} from './multiTokenPeriodBuilder';
import {
  nativeBalanceChange,
  nativeBalanceChangeBuilder,
} from './nativeBalanceChangeBuilder';
import {
  nativeTokenPayment,
  nativeTokenPaymentBuilder,
} from './nativeTokenPaymentBuilder';
import {
  nativeTokenPeriodTransfer,
  nativeTokenPeriodTransferBuilder,
} from './nativeTokenPeriodTransferBuilder';
import {
  nativeTokenStreaming,
  nativeTokenStreamingBuilder,
} from './nativeTokenStreamingBuilder';
import {
  nativeTokenTransferAmount,
  nativeTokenTransferAmountBuilder,
} from './nativeTokenTransferAmountBuilder';
import { nonce, nonceBuilder } from './nonceBuilder';
import {
  ownershipTransfer,
  ownershipTransferBuilder,
} from './ownershipTransferBuilder';
import { redeemer, redeemerBuilder } from './redeemerBuilder';
import {
  specificActionERC20TransferBatch,
  specificActionERC20TransferBatchBuilder,
} from './specificActionERC20TransferBatchBuilder';
import { timestamp, timestampBuilder } from './timestampBuilder';
import { valueLte, valueLteBuilder } from './valueLteBuilder';

// While we could derive CoreCaveatMap from the createCaveatBuilder function,
// doing so would significantly complicate type resolution. By explicitly
// declaring the return type of createCaveatBuilder, we ensure the caveat
// map remains synchronized with the actual implementation.
type CoreCaveatMap = {
  [CaveatType.AllowedMethods]: typeof allowedMethodsBuilder;
  [CaveatType.AllowedTargets]: typeof allowedTargetsBuilder;
  [CaveatType.Deployed]: typeof deployedBuilder;
  [CaveatType.AllowedCalldata]: typeof allowedCalldataBuilder;
  [CaveatType.Erc20BalanceChange]: typeof erc20BalanceChangeBuilder;
  [CaveatType.Erc721BalanceChange]: typeof erc721BalanceChangeBuilder;
  [CaveatType.Erc1155BalanceChange]: typeof erc1155BalanceChangeBuilder;
  [CaveatType.ValueLte]: typeof valueLteBuilder;
  [CaveatType.LimitedCalls]: typeof limitedCallsBuilder;
  [CaveatType.Id]: typeof idBuilder;
  [CaveatType.Nonce]: typeof nonceBuilder;
  [CaveatType.Timestamp]: typeof timestampBuilder;
  [CaveatType.BlockNumber]: typeof blockNumberBuilder;
  [CaveatType.Erc20TransferAmount]: typeof erc20TransferAmountBuilder;
  [CaveatType.Erc20Streaming]: typeof erc20StreamingBuilder;
  [CaveatType.NativeTokenStreaming]: typeof nativeTokenStreamingBuilder;
  [CaveatType.Erc721Transfer]: typeof erc721TransferBuilder;
  [CaveatType.NativeTokenTransferAmount]: typeof nativeTokenTransferAmountBuilder;
  [CaveatType.NativeBalanceChange]: typeof nativeBalanceChangeBuilder;
  [CaveatType.Redeemer]: typeof redeemerBuilder;
  [CaveatType.NativeTokenPayment]: typeof nativeTokenPaymentBuilder;
  [CaveatType.ArgsEqualityCheck]: typeof argsEqualityCheckBuilder;
  [CaveatType.SpecificActionERC20TransferBatch]: typeof specificActionERC20TransferBatchBuilder;
  [CaveatType.Erc20PeriodTransfer]: typeof erc20PeriodTransferBuilder;
  [CaveatType.NativeTokenPeriodTransfer]: typeof nativeTokenPeriodTransferBuilder;
  [CaveatType.ExactCalldataBatch]: typeof exactCalldataBatchBuilder;
  [CaveatType.ExactCalldata]: typeof exactCalldataBuilder;
  [CaveatType.ExactExecution]: typeof exactExecutionBuilder;
  [CaveatType.ExactExecutionBatch]: typeof exactExecutionBatchBuilder;
  [CaveatType.MultiTokenPeriod]: typeof multiTokenPeriodBuilder;
  [CaveatType.OwnershipTransfer]: typeof ownershipTransferBuilder;
};

/**
 * A caveat builder type that includes all core caveat types pre-configured.
 * This type represents a fully configured caveat builder with all the standard
 * caveat builders available for use.
 */
export type CoreCaveatBuilder = CaveatBuilder<CoreCaveatMap>;

// Re-export CaveatType for convenience
export { CaveatType } from './caveatType';

// Shared utility for allowing enum or string value for discriminated union types.
// This converts a config type to accept both the enum value and its string representation.
// We preserve the discriminated union pattern by using TConfig['type'] instead of
// expanding to the full enum, which ensures TypeScript can narrow by the type field.
export type ConvertEnumConfigToInputs<TConfig extends { type: string }> =
  TConfig extends { type: string }
    ? Omit<TConfig, 'type'> & { type: TConfig['type'] | `${TConfig['type']}` }
    : never;

// Backward compatibility alias for caveat configs
export type ConvertCaveatConfigsToInputs<TConfig extends { type: string }> =
  ConvertEnumConfigToInputs<TConfig>;

type ExtractCaveatMapType<TCaveatBuilder extends CaveatBuilder<any>> =
  TCaveatBuilder extends CaveatBuilder<infer TCaveatMap> ? TCaveatMap : never;
type ExtractedCoreMap = ExtractCaveatMapType<CoreCaveatBuilder>;

export type CaveatConfigurations = {
  [TType in keyof ExtractedCoreMap]: {
    type: TType;
  } & Parameters<ExtractedCoreMap[TType]>[1];
}[keyof ExtractedCoreMap];

export type CaveatConfiguration<
  TCaveatBuilder extends CaveatBuilder<any>,
  CaveatMap = ExtractCaveatMapType<TCaveatBuilder>,
> =
  CaveatMap extends Record<string, (...args: any[]) => any>
    ? ConvertEnumConfigToInputs<
        {
          [TType in keyof CaveatMap]: {
            type: TType extends string ? TType : never;
          } & Parameters<CaveatMap[TType]>[1];
        }[keyof CaveatMap]
      >
    : never;

export type CoreCaveatConfiguration = CaveatConfiguration<CoreCaveatBuilder>;

/**
 * Creates a caveat builder with all core caveat types pre-configured.
 *
 * @param environment - The DeleGator environment configuration.
 * @param config - Optional configuration for the caveat builder.
 * @returns A fully configured CoreCaveatBuilder instance with all core caveat types.
 */
export const createCaveatBuilder = (
  environment: SmartAccountsEnvironment,
  config?: CaveatBuilderConfig,
): CoreCaveatBuilder => {
  const caveatBuilder = new CaveatBuilder(environment, config)
    .extend(allowedMethods, allowedMethodsBuilder)
    .extend(allowedTargets, allowedTargetsBuilder)
    .extend(deployed, deployedBuilder)
    .extend(allowedCalldata, allowedCalldataBuilder)
    .extend(erc20BalanceChange, erc20BalanceChangeBuilder)
    .extend(erc721BalanceChange, erc721BalanceChangeBuilder)
    .extend(erc1155BalanceChange, erc1155BalanceChangeBuilder)
    .extend(valueLte, valueLteBuilder)
    .extend(limitedCalls, limitedCallsBuilder)
    .extend(id, idBuilder)
    .extend(nonce, nonceBuilder)
    .extend(timestamp, timestampBuilder)
    .extend(blockNumber, blockNumberBuilder)
    .extend(erc20TransferAmount, erc20TransferAmountBuilder)
    .extend(erc20Streaming, erc20StreamingBuilder)
    .extend(nativeTokenStreaming, nativeTokenStreamingBuilder)
    .extend(erc721Transfer, erc721TransferBuilder)
    .extend(nativeTokenTransferAmount, nativeTokenTransferAmountBuilder)
    .extend(nativeBalanceChange, nativeBalanceChangeBuilder)
    .extend(redeemer, redeemerBuilder)
    .extend(nativeTokenPayment, nativeTokenPaymentBuilder)
    .extend(argsEqualityCheck, argsEqualityCheckBuilder)
    .extend(
      specificActionERC20TransferBatch,
      specificActionERC20TransferBatchBuilder,
    )
    .extend(erc20PeriodTransfer, erc20PeriodTransferBuilder)
    .extend(nativeTokenPeriodTransfer, nativeTokenPeriodTransferBuilder)
    .extend(exactCalldataBatch, exactCalldataBatchBuilder)
    .extend(exactCalldata, exactCalldataBuilder)
    .extend(exactExecution, exactExecutionBuilder)
    .extend(exactExecutionBatch, exactExecutionBatchBuilder)
    .extend(multiTokenPeriod, multiTokenPeriodBuilder)
    .extend(ownershipTransfer, ownershipTransferBuilder);

  return caveatBuilder;
};
