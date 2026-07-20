import { makeErc20TokenAllowanceDecoderConfig } from './caveats/erc20TokenAllowance';
import { makeErc20TokenPeriodicDecoderConfig } from './caveats/erc20TokenPeriodic';
import { makeErc20TokenStreamDecoderConfig } from './caveats/erc20TokenStream';
import { makeNativeTokenAllowanceDecoderConfig } from './caveats/nativeTokenAllowance';
import { makeNativeTokenPeriodicDecoderConfig } from './caveats/nativeTokenPeriodic';
import { makeNativeTokenStreamDecoderConfig } from './caveats/nativeTokenStream';
import { makeTokenApprovalRevocationDecoderConfig } from './caveats/tokenApprovalRevocation';
import type { EnforcerAddressesByName, PermissionDecoderConfig } from './types';
import { checksumEnforcerAddresses } from './utils';

export {
  createErc20TokenStreamCaveats,
  type Erc20TokenStreamEnforcers,
} from './caveats/erc20TokenStream';
export {
  createErc20TokenPeriodicCaveats,
  type Erc20TokenPeriodicEnforcers,
} from './caveats/erc20TokenPeriodic';
export {
  createErc20TokenAllowanceCaveats,
  type Erc20TokenAllowanceEnforcers,
} from './caveats/erc20TokenAllowance';
export {
  createNativeTokenStreamCaveats,
  type NativeTokenStreamEnforcers,
} from './caveats/nativeTokenStream';
export {
  createNativeTokenPeriodicCaveats,
  type NativeTokenPeriodicEnforcers,
} from './caveats/nativeTokenPeriodic';
export {
  createNativeTokenAllowanceCaveats,
  type NativeTokenAllowanceEnforcers,
} from './caveats/nativeTokenAllowance';
export {
  createTokenApprovalRevocationCaveats,
  type TokenApprovalRevocationEnforcers,
} from './caveats/tokenApprovalRevocation';

export type { ExpiryRule } from './rules/expiry';
export type { PayeeRule } from './rules/payee';
export type { RedeemerRule } from './rules/redeemer';
export type { EnforcerAddressesByName, PermissionDecoderConfig };
export {
  DAY,
  FORTNIGHT,
  HOUR,
  MAX_UINT256,
  MONTH,
  SECOND,
  WEEK,
  YEAR,
  ALL_METAMASK_FACILITATOR_ADDRESSES,
  METAMASK_FACILITATOR_ADDRESSES,
  METAMASK_FACILITATOR_ADDRESSES_DEV,
  areOnlyMetaMaskFacilitatorAddresses,
  isMetaMaskFacilitatorAddress,
  convertAmountPerSecondToAmountPerPeriod,
  convertMillisecondsToSeconds,
  formatPermissionPeriodDuration,
  getPeriodFrequencyValueTranslationKey,
  parseHexPermissionAmount,
  getPermissionSchemaEntry,
} from './schema';
export type {
  AccountField,
  AddressField,
  AmountField,
  DateField,
  DividerElement,
  ExpiryField,
  FieldView,
  I18nFunction,
  JustificationField,
  ListField,
  NetworkField,
  OriginField,
  PermissionRenderContext,
  PermissionSchemaEntry,
  PermissionSchemaRegistry,
  RawTextField,
  ReviewFieldView,
  RuleAddressField,
  SchemaElement,
  SchemaSection,
  TextField,
  TokenResolution,
  TokenVariant,
} from './schema';

/**
 * Builds the canonical set of permission decoders for a chain.
 *
 * @param contracts - Deployed delegation framework contracts for one chain.
 * @returns The full set of permission decoders for the chain.
 */
export const makePermissionDecoderConfigs = (
  contracts: EnforcerAddressesByName,
): PermissionDecoderConfig[] => {
  const enforcerAddresses = checksumEnforcerAddresses(contracts);

  return [
    makeNativeTokenStreamDecoderConfig(enforcerAddresses),
    makeNativeTokenPeriodicDecoderConfig(enforcerAddresses),
    makeNativeTokenAllowanceDecoderConfig(enforcerAddresses),
    makeErc20TokenStreamDecoderConfig(enforcerAddresses),
    makeErc20TokenPeriodicDecoderConfig(enforcerAddresses),
    makeErc20TokenAllowanceDecoderConfig(enforcerAddresses),
    makeTokenApprovalRevocationDecoderConfig(enforcerAddresses),
  ];
};
