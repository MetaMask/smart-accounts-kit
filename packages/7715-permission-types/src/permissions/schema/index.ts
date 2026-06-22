import type { Hex } from '@metamask/utils';

import { DAY, MAX_UINT256 } from './constants';
import { areOnlyMetaMaskFacilitatorAddresses } from './facilitatorAddresses';
import type {
  I18nValue,
  PermissionRenderContext,
  PermissionSchemaEntry,
  PermissionSchemaRegistry,
  SchemaSection,
} from './types';
import {
  convertAmountPerSecondToAmountPerPeriod,
  formatPermissionPeriodDuration,
  getPeriodFrequencyValueTranslationKey,
  parseHexPermissionAmount,
} from './utils';

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
  DeepNonNullable,
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

const getData = <TReturn = unknown>(
  ctx: PermissionRenderContext,
  key: string,
): TReturn => ctx.permission.data[key] as TReturn;

/**
 * Reads stream total exposure from the schema context.
 *
 * @param ctx - Permission render context.
 * @returns Total exposure, or null for unlimited exposure.
 */
function getStreamTotalExposure(ctx: PermissionRenderContext): bigint | null {
  if (ctx.streamTotalExposure === undefined) {
    throw new Error(
      'PermissionRenderContext.streamTotalExposure must be set when rendering stream permission fields',
    );
  }
  return ctx.streamTotalExposure;
}

const requireStartTime = (permission: {
  data: Record<string, unknown>;
}): void => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
};

const alwaysVisible = (): boolean => true;

const getJustificationValue = (
  ctx: PermissionRenderContext,
): string | I18nValue => {
  if (ctx.permission.justification) {
    return ctx.permission.justification;
  }
  return { key: 'gatorNoJustificationProvided' };
};

const TOKEN_APPROVAL_REVOCATION_METHODS: {
  key: string;
  translationKey: string;
}[] = [
  {
    key: 'erc20Approve',
    translationKey: 'gatorPermissionsErc20ApproveRevocation',
  },
  {
    key: 'erc721Approve',
    translationKey: 'gatorPermissionsErc721ApproveRevocation',
  },
  {
    key: 'erc721SetApprovalForAll',
    translationKey: 'gatorPermissionsSetApprovalForAllRevocation',
  },
  {
    key: 'permit2Approve',
    translationKey: 'gatorPermissionsPermit2ApproveRevocation',
  },
  {
    key: 'permit2Lockdown',
    translationKey: 'gatorPermissionsPermit2Lockdown',
  },
  {
    key: 'permit2InvalidateNonces',
    translationKey: 'gatorPermissionsPermit2InvalidateNonces',
  },
];

const TOKEN_APPROVAL_REVOCATION_PRIMITIVE_KEYS =
  TOKEN_APPROVAL_REVOCATION_METHODS.map(({ key }) => key);

/**
 * Gets translation keys for enabled token approval revocation methods.
 *
 * @param ctx - Permission render context.
 * @returns Translation keys for enabled revocation methods.
 */
function getEnabledTokenApprovalRevocationMethods(
  ctx: PermissionRenderContext,
): string[] {
  return TOKEN_APPROVAL_REVOCATION_METHODS.filter(({ key }) =>
    Boolean(getData<boolean | undefined>(ctx, key)),
  ).map(({ translationKey }) => translationKey);
}

/**
 * Checks whether all token approval revocation primitives are enabled.
 *
 * @param ctx - Permission render context.
 * @returns True when every token approval revocation primitive is enabled.
 */
function hasAllTokenApprovalRevocationPrimitivesEnabled(
  ctx: PermissionRenderContext,
): boolean {
  return TOKEN_APPROVAL_REVOCATION_PRIMITIVE_KEYS.every((key) =>
    Boolean(getData<boolean | undefined>(ctx, key)),
  );
}

const justificationSection: SchemaSection = {
  testId: 'confirmation_justification-section',
  elements: [
    {
      type: 'justification',
      labelKey: 'gatorPermissionsJustification',
      testId: 'review-gator-permission-justification',
      getValue: getJustificationValue,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'account',
      labelKey: 'account',
      testId: 'review-gator-permission-account-name',
      getValue: () => undefined,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
  ],
};

const reviewSummaryAccountSection: SchemaSection = {
  testId: 'review_summary-account-section',
  elements: [
    {
      type: 'account',
      labelKey: 'account',
      testId: 'review-gator-permission-account-name',
      getValue: () => undefined,
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
  ],
};

const permissionInfoSection: SchemaSection = {
  testId: 'confirmation_permission-section',
  elements: [
    {
      type: 'origin',
      labelKey: 'requestFrom',
      testId: 'confirmation-origin',
      getValue: (ctx) => ctx.origin,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
    {
      type: 'address',
      labelKey: 'recipient',
      testId: 'confirmation-recipient',
      getValue: (ctx) => ctx.to,
      isVisible: (ctx) => Boolean(ctx.to),
      includeInViews: ['confirmation'],
    },
    { type: 'network', includeInViews: ['confirmation', 'reviewDetail'] },
    {
      type: 'text',
      labelKey: 'redeemers',
      testId: 'confirmation-redeemer-metamask-facilitator',
      getValue: () => ({ key: 'gatorPermissionsMetaMaskFacilitator' }),
      isVisible: (ctx) =>
        areOnlyMetaMaskFacilitatorAddresses(ctx.redeemerAddresses),
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'rule-address',
      labelKey: 'redeemer',
      testId: 'confirmation-redeemer',
      getValue: (ctx) => ctx.redeemerAddresses ?? undefined,
      isVisible: (ctx) =>
        Boolean(ctx.redeemerAddresses?.length) &&
        !areOnlyMetaMaskFacilitatorAddresses(ctx.redeemerAddresses),
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'rule-address',
      labelKey: 'payee',
      testId: 'confirmation-payee',
      getValue: (ctx) => ctx.payeeAddresses ?? undefined,
      isVisible: (ctx) => Boolean(ctx.payeeAddresses?.length),
      includeInViews: ['confirmation', 'reviewDetail'],
    },
  ],
};

const periodicDetailsSection = (
  testId: string,
  tokenAddressKey?: string,
): SchemaSection => ({
  testId,
  elements: [
    {
      type: 'amount',
      labelKey: 'amount',
      testId: 'review-gator-permission-amount-label',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
    {
      type: 'text',
      labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
      testId: 'review-gator-permission-frequency-label',
      getValue: (ctx) => ({
        key: getPeriodFrequencyValueTranslationKey(
          getData<number>(ctx, 'periodDuration'),
        ),
      }),
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
    {
      type: 'amount',
      labelKey: 'confirmFieldAllowance',
      testId: 'confirmation-allowance',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
    {
      type: 'text',
      labelKey: 'confirmFieldFrequency',
      testId: 'confirmation-frequency',
      getValue: (ctx) =>
        formatPermissionPeriodDuration(getData<number>(ctx, 'periodDuration')),
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
    { type: 'divider', includeInViews: ['confirmation'] },
    {
      type: 'date',
      labelKey: 'gatorPermissionsStartDate',
      testId: 'review-gator-permission-start-date',
      getValue: (ctx) => getData<number>(ctx, 'startTime'),
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'expiry',
      labelKey: 'gatorPermissionsExpirationDate',
      testId: 'review-gator-permission-expiration-date',
      getValue: (ctx) => ctx.expiry,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
  ],
});

const streamDetailsSection = (
  testId: string,
  tokenAddressKey?: string,
): SchemaSection => ({
  testId,
  elements: [
    {
      type: 'amount',
      labelKey: 'gatorPermissionsStreamingAmountLabel',
      testId: 'review-gator-permission-amount-label',
      getValue: (ctx) =>
        parseHexPermissionAmount(
          convertAmountPerSecondToAmountPerPeriod(
            getData<Hex>(ctx, 'amountPerSecond'),
            'weekly',
          ),
        ),
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
    {
      type: 'text',
      labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
      testId: 'review-gator-permission-frequency-label',
      getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
    {
      type: 'amount',
      labelKey: 'gatorPermissionsInitialAllowance',
      testId: 'review-gator-permission-initial-allowance',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'initialAmount')),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: (ctx): boolean => Boolean(getData(ctx, 'initialAmount')),
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'amount',
      labelKey: 'gatorPermissionsMaxAllowance',
      testId: 'review-gator-permission-max-allowance',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'maxAmount')),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: (ctx): boolean => {
        const max = getData<string | null | undefined>(ctx, 'maxAmount');
        return (
          max !== undefined && max !== null && max.toLowerCase() !== MAX_UINT256
        );
      },
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'text',
      labelKey: 'gatorPermissionsMaxAllowance',
      testId: 'review-gator-permission-max-allowance-unlimited',
      getValue: () => ({ key: 'unlimited' }),
      isVisible: (ctx): boolean => {
        const max = getData<string | null | undefined>(ctx, 'maxAmount');
        return Boolean(max?.toLowerCase() === MAX_UINT256);
      },
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    { type: 'divider', includeInViews: ['confirmation'] },
    {
      type: 'date',
      labelKey: 'gatorPermissionsStartDate',
      testId: 'review-gator-permission-start-date',
      getValue: (ctx) => getData<number>(ctx, 'startTime'),
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'expiry',
      labelKey: 'gatorPermissionsExpirationDate',
      testId: 'review-gator-permission-expiration-date',
      getValue: (ctx) => ctx.expiry,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
  ],
});

const streamRateSection = (
  testId: string,
  tokenAddressKey?: string,
): SchemaSection => ({
  testId,
  elements: [
    {
      type: 'amount',
      labelKey: 'gatorPermissionsStreamRate',
      testId: 'review-gator-permission-stream-rate',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'amountPerSecond')),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isRatePerSecond: true,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'amount',
      labelKey: 'confirmFieldAvailablePerDay',
      testId: 'confirmation-available-per-day',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'amountPerSecond')) *
        BigInt(DAY / 1000),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
    {
      type: 'amount',
      labelKey: 'confirmFieldTotalExposure',
      testId: 'confirmation-total-exposure',
      getValue: (ctx) => getStreamTotalExposure(ctx) ?? 0n,
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: (ctx): boolean => getStreamTotalExposure(ctx) !== null,
      includeInViews: ['confirmation'],
    },
    {
      type: 'text',
      labelKey: 'confirmFieldTotalExposure',
      testId: 'confirmation-total-exposure-unlimited',
      getValue: () => ({ key: 'unlimited' }),
      isVisible: (ctx): boolean => getStreamTotalExposure(ctx) === null,
      includeInViews: ['confirmation'],
    },
  ],
});

const allowanceDetailsSection = (
  testId: string,
  tokenAddressKey?: string,
): SchemaSection => ({
  testId,
  elements: [
    {
      type: 'amount',
      labelKey: 'amount',
      testId: 'review-gator-permission-amount-label',
      getValue: (ctx) =>
        parseHexPermissionAmount(getData<string>(ctx, 'allowanceAmount')),
      getTokenAddress: tokenAddressKey
        ? (ctx): Hex => getData<Hex>(ctx, tokenAddressKey)
        : undefined,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewSummary'],
    },
    {
      type: 'date',
      labelKey: 'gatorPermissionsStartDate',
      testId: 'review-gator-permission-start-date',
      getValue: (ctx) => getData<number>(ctx, 'startTime'),
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'expiry',
      labelKey: 'gatorPermissionsExpirationDate',
      testId: 'review-gator-permission-expiration-date',
      getValue: (ctx) => ctx.expiry,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
  ],
});

const nativeTokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    periodicDetailsSection('native-token-periodic-details-section'),
    reviewSummaryAccountSection,
  ],
};

const nativeTokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    streamDetailsSection('native-token-stream-details-section'),
    streamRateSection('native-token-stream-stream-rate-section'),
    reviewSummaryAccountSection,
  ],
};

const nativeTokenAllowanceSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    allowanceDetailsSection('native-token-allowance-details-section'),
    reviewSummaryAccountSection,
  ],
};

const erc20TokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    periodicDetailsSection(
      'erc20-token-periodic-details-section',
      'tokenAddress',
    ),
    reviewSummaryAccountSection,
  ],
};

const erc20TokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    streamDetailsSection('erc20-token-stream-details-section', 'tokenAddress'),
    streamRateSection('erc20-token-stream-stream-rate-section', 'tokenAddress'),
    reviewSummaryAccountSection,
  ],
};

const erc20TokenAllowanceSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (permission) => permission.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    allowanceDetailsSection(
      'erc20-token-allowance-details-section',
      'tokenAddress',
    ),
    reviewSummaryAccountSection,
  ],
};

const tokenApprovalRevocationSchema: PermissionSchemaEntry = {
  tokenVariant: 'none',
  tokenResolution: { kind: 'none' },
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'token-approval-revocation-details-section',
      elements: [
        {
          type: 'text',
          labelKey: 'revokeTokenApprovals',
          testId: 'review-gator-permission-amount-label',
          getValue: () => ({ key: 'allTokens' }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionsRevocationMethods',
          testId:
            'review-gator-permission-all-token-approval-revocation-primitives',
          getValue: () => ({
            key: 'gatorPermissionsAllTokenApprovalRevocationPrimitives',
          }),
          isVisible: (ctx) =>
            hasAllTokenApprovalRevocationPrimitivesEnabled(ctx),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'list',
          labelKey: 'gatorPermissionsRevocationMethods',
          testId: 'review-gator-permission-revocation-methods',
          getValue: (ctx) => getEnabledTokenApprovalRevocationMethods(ctx),
          isVisible: (ctx) =>
            !hasAllTokenApprovalRevocationPrimitivesEnabled(ctx),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

const unknownPermissionTypeSchema: PermissionSchemaEntry = {
  tokenVariant: 'none',
  tokenResolution: { kind: 'none' },
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'unknown-permission-type-details-section',
      elements: [
        {
          type: 'raw-text',
          labelKey: 'unknownPermissionType',
          testId: 'review-gator-permission-unknown-type',
          getValue: (ctx) => ctx.permission.type,
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
      ],
    },
  ],
};

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
  const matchingSchema = PERMISSION_SCHEMAS[permissionType];
  if (matchingSchema) {
    return matchingSchema;
  }
  if (throwIfUnknown) {
    throw new Error(`Unknown permission type: ${permissionType}`);
  }

  return unknownPermissionTypeSchema;
}
