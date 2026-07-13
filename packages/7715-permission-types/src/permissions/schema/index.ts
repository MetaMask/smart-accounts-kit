import { erc20TokenAllowanceSchema } from './erc20TokenAllowance';
import { erc20TokenPeriodicSchema } from './erc20TokenPeriodic';
import { erc20TokenStreamSchema } from './erc20TokenStream';
import { nativeTokenAllowanceSchema } from './nativeTokenAllowance';
import { nativeTokenPeriodicSchema } from './nativeTokenPeriodic';
import { nativeTokenStreamSchema } from './nativeTokenStream';
import { tokenApprovalRevocationSchema } from './tokenApprovalRevocation';
import type { PermissionSchemaEntry, PermissionSchemaRegistry } from './types';
import { unknownPermissionTypeSchema } from './unknownPermissionType';

export {
  DAY,
  FORTNIGHT,
  HOUR,
  MAX_UINT256,
  MONTH,
  SECOND,
  WEEK,
  YEAR,
} from './constants';
export {
  ALL_METAMASK_FACILITATOR_ADDRESSES,
  METAMASK_FACILITATOR_ADDRESSES,
  METAMASK_FACILITATOR_ADDRESSES_DEV,
  areOnlyMetaMaskFacilitatorAddresses,
  isMetaMaskFacilitatorAddress,
} from './facilitatorAddresses';
export type {
  AccountField,
  AddressField,
  AmountField,
  DateField,
  DividerElement,
  ExpiryField,
  FieldView,
  I18nFunction,
  I18nValue,
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
} from './types';
export {
  convertAmountPerSecondToAmountPerPeriod,
  convertMillisecondsToSeconds,
  formatPermissionPeriodDuration,
  getPeriodFrequencyValueTranslationKey,
  parseHexPermissionAmount,
} from './utils';

const PERMISSION_SCHEMAS: PermissionSchemaRegistry = {
  'native-token-periodic': nativeTokenPeriodicSchema,
  'native-token-stream': nativeTokenStreamSchema,
  'native-token-allowance': nativeTokenAllowanceSchema,
  'erc20-token-periodic': erc20TokenPeriodicSchema,
  'erc20-token-stream': erc20TokenStreamSchema,
  'erc20-token-allowance': erc20TokenAllowanceSchema,
  'token-approval-revocation': tokenApprovalRevocationSchema,
};

/**
 * Gets the schema entry for a permission type.
 *
 * @param permissionType - Permission type identifier.
 * @param throwIfUnknown - Whether to throw instead of returning the unknown schema.
 * @returns The matching schema, or the unknown permission schema fallback.
 */
export function getPermissionSchemaEntry(
  permissionType: string,
  throwIfUnknown: boolean = false,
): PermissionSchemaEntry {
  if (
    Object.prototype.hasOwnProperty.call(PERMISSION_SCHEMAS, permissionType)
  ) {
    return (PERMISSION_SCHEMAS as Record<string, PermissionSchemaEntry>)[
      permissionType
    ] as PermissionSchemaEntry;
  }
  if (throwIfUnknown) {
    throw new Error(`Unknown permission type: ${permissionType}`);
  }

  return unknownPermissionTypeSchema;
}
