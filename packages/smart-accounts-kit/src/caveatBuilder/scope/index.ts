import { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';

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

export type ScopeConfig =
  | Erc20TransferScopeConfig
  | Erc20StreamingScopeConfig
  | Erc20PeriodicScopeConfig
  | NativeTokenTransferScopeConfig
  | NativeTokenStreamingScopeConfig
  | NativeTokenPeriodicScopeConfig
  | Erc721ScopeConfig
  | OwnershipScopeConfig
  | FunctionCallScopeConfig;

export const createCaveatBuilderFromScope = (
  environment: SmartAccountsEnvironment,
  scopeConfig: ScopeConfig,
) => {
  switch (scopeConfig.type) {
    case ScopeType.Erc20TransferAmount:
      return createErc20TransferCaveatBuilder(environment, scopeConfig);
    case ScopeType.Erc20Streaming:
      return createErc20StreamingCaveatBuilder(environment, scopeConfig);
    case ScopeType.Erc20PeriodTransfer:
      return createErc20PeriodicCaveatBuilder(environment, scopeConfig);
    case ScopeType.NativeTokenTransferAmount:
      return createNativeTokenTransferCaveatBuilder(environment, scopeConfig);
    case ScopeType.NativeTokenStreaming:
      return createNativeTokenStreamingCaveatBuilder(environment, scopeConfig);
    case ScopeType.NativeTokenPeriodTransfer:
      return createNativeTokenPeriodicCaveatBuilder(environment, scopeConfig);
    case ScopeType.Erc721Transfer:
      return createErc721CaveatBuilder(environment, scopeConfig);
    case ScopeType.OwnershipTransfer:
      return createOwnershipCaveatBuilder(environment, scopeConfig);
    case ScopeType.FunctionCall:
      return createFunctionCallCaveatBuilder(environment, scopeConfig);
    default:
      // eslint-disable-next-line no-case-declarations
      const exhaustivenessCheck: never = scopeConfig;
      throw new Error(
        `Invalid scope type: ${(exhaustivenessCheck as { type: string }).type}`,
      );
  }
};
