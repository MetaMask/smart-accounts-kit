import {
  type Erc20PeriodicScopeConfig,
  createErc20PeriodicCaveatBuilder,
} from './erc20PeriodicScope';
import {
  type Erc20StreamingScopeConfig,
  createErc20StreamingCaveatBuilder,
} from './erc20StreamingScope';
import {
  type Erc20TransferScopeConfig,
  createErc20TransferCaveatBuilder,
} from './erc20TransferScope';
import {
  type Erc721ScopeConfig,
  createErc721CaveatBuilder,
} from './erc721Scope';
import {
  createFunctionCallCaveatBuilder,
  type FunctionCallScopeConfig,
} from './functionCallScope';
import {
  type NativeTokenPeriodicScopeConfig,
  createNativeTokenPeriodicCaveatBuilder,
} from './nativeTokenPeriodicScope';
import {
  type NativeTokenStreamingScopeConfig,
  createNativeTokenStreamingCaveatBuilder,
} from './nativeTokenStreamingScope';
import {
  type NativeTokenTransferScopeConfig,
  createNativeTokenTransferCaveatBuilder,
} from './nativeTokenTransferScope';
import {
  createOwnershipCaveatBuilder,
  type OwnershipScopeConfig,
} from './ownershipScope';
import { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';

// We want to allow the scope `type` to be passed as either an enum reference,
// or the enum's string value this generic accepts a union of scope configs, and
// converts them to an identical union except the `type` parameter is converted
// to a union of `ScopeType.XXXX | `${ScopeType.XXXX}`.
export type ConvertScopeConfigsToInputs<T extends { type: ScopeType }> =
  T extends { type: ScopeType }
    ? Omit<T, 'type'> & { type: T['type'] | `${T['type']}` }
    : never;

type ScopeConfigBase =
  | Erc20TransferScopeConfig
  | Erc20StreamingScopeConfig
  | Erc20PeriodicScopeConfig
  | NativeTokenTransferScopeConfig
  | NativeTokenStreamingScopeConfig
  | NativeTokenPeriodicScopeConfig
  | Erc721ScopeConfig
  | OwnershipScopeConfig
  | FunctionCallScopeConfig;

export type ScopeConfig = ConvertScopeConfigsToInputs<ScopeConfigBase>;

const normalizeScopeConfig = (config: ScopeConfig): ScopeConfigBase => {
  return {
    ...config,
    type: config.type as ScopeType,
  } as ScopeConfigBase;
};

export const createCaveatBuilderFromScope = (
  environment: SmartAccountsEnvironment,
  scopeConfig: ScopeConfig,
): CoreCaveatBuilder => {
  const normalizedScopeConfig = normalizeScopeConfig(scopeConfig);

  switch (normalizedScopeConfig.type) {
    case ScopeType.Erc20TransferAmount:
      return createErc20TransferCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.Erc20Streaming:
      return createErc20StreamingCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.Erc20PeriodTransfer:
      return createErc20PeriodicCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.NativeTokenTransferAmount:
      return createNativeTokenTransferCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.NativeTokenStreaming:
      return createNativeTokenStreamingCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.NativeTokenPeriodTransfer:
      return createNativeTokenPeriodicCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    case ScopeType.Erc721Transfer:
      return createErc721CaveatBuilder(environment, normalizedScopeConfig);
    case ScopeType.OwnershipTransfer:
      return createOwnershipCaveatBuilder(environment, normalizedScopeConfig);
    case ScopeType.FunctionCall:
      return createFunctionCallCaveatBuilder(
        environment,
        normalizedScopeConfig,
      );
    default:
      // eslint-disable-next-line no-case-declarations
      const exhaustivenessCheck: never = normalizedScopeConfig;
      throw new Error(
        `Invalid scope type: ${(exhaustivenessCheck as { type: string }).type}`,
      );
  }
};
