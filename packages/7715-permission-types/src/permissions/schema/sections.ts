import type { Hex } from '@metamask/utils';

import { DAY, MAX_UINT256 } from './constants';
import { areOnlyMetaMaskFacilitatorAddresses } from './facilitatorAddresses';
import type {
  I18nValue,
  PermissionRenderContext,
  SchemaSection,
} from './types';
import {
  convertAmountPerSecondToAmountPerPeriod,
  formatPermissionPeriodDuration,
  getPeriodFrequencyValueTranslationKey,
  parseHexPermissionAmount,
} from './utils';

export const getData = <TReturn = unknown>(
  ctx: PermissionRenderContext,
  key: string,
): TReturn => ctx.permission.data[key] as TReturn;

/**
 * Reads stream total exposure from the schema context.
 *
 * @param ctx - Permission render context.
 * @returns Total exposure, or null for unlimited exposure.
 */
export function getStreamTotalExposure(
  ctx: PermissionRenderContext,
): bigint | null {
  if (ctx.streamTotalExposure === undefined) {
    throw new Error(
      'PermissionRenderContext.streamTotalExposure must be set when rendering stream permission fields',
    );
  }
  return ctx.streamTotalExposure;
}

export const requireStartTime = (permission: {
  data: Record<string, unknown>;
}): void => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
};

export const alwaysVisible = (): boolean => true;

const getJustificationValue = (
  ctx: PermissionRenderContext,
): string | I18nValue => {
  if (ctx.permission.justification) {
    return ctx.permission.justification;
  }
  return { key: 'gatorNoJustificationProvided' };
};

export const justificationSection: SchemaSection = {
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

export const reviewSummaryAccountSection: SchemaSection = {
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

export const permissionInfoSection: SchemaSection = {
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

export const periodicDetailsSection = (
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

export const streamDetailsSection = (
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

export const streamRateSection = (
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

export const allowanceDetailsSection = (
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
