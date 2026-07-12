import { bigIntToHex, type Hex, hexToBigInt } from '@metamask/utils';

import { DAY, FORTNIGHT, HOUR, MONTH, SECOND, WEEK, YEAR } from './constants';
import type { I18nValue } from './types';

/**
 * Parses a permission amount string as an unsigned EVM integer.
 *
 * Strings without a `0x` prefix are still interpreted as hexadecimal, not
 * decimal. That matches uint values from RPC / typed data.
 *
 * @param value - Hex string with or without `0x` / `0X` prefix.
 * @returns The parsed amount as a bigint.
 */
export function parseHexPermissionAmount(value: string): bigint {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error('Cannot parse empty permission amount');
  }

  return hexToBigInt(trimmed as Hex);
}

/**
 * Returns an i18n key for a period duration in seconds.
 *
 * @param periodDurationInSeconds - The period duration in seconds.
 * @returns The translation key for the frequency description.
 */
export function getPeriodFrequencyValueTranslationKey(
  periodDurationInSeconds: number,
): string {
  const periodDurationMillisecond = periodDurationInSeconds * SECOND;
  if (periodDurationMillisecond === DAY) {
    return 'gatorPermissionDailyFrequency';
  } else if (periodDurationMillisecond === WEEK) {
    return 'gatorPermissionWeeklyFrequency';
  } else if (periodDurationMillisecond === FORTNIGHT) {
    return 'gatorPermissionFortnightlyFrequency';
  } else if (periodDurationMillisecond === MONTH) {
    return 'gatorPermissionMonthlyFrequency';
  } else if (periodDurationMillisecond === YEAR) {
    return 'gatorPermissionAnnualFrequency';
  }
  return 'gatorPermissionCustomFrequency';
}

/**
 * Returns an i18n key and optional args for a period duration in seconds.
 *
 * @param periodSeconds - The period duration in seconds.
 * @returns A translatable period duration value.
 */
export function formatPermissionPeriodDuration(
  periodSeconds: number,
): I18nValue {
  if (periodSeconds === 0) {
    throw new Error('Cannot format period duration of 0 seconds');
  }

  if (periodSeconds < 0) {
    throw new Error('Cannot format negative period duration');
  }

  const periodMilliseconds = periodSeconds * SECOND;

  switch (periodMilliseconds) {
    case HOUR:
      return { key: 'confirmFieldPeriodDurationHourly' };
    case DAY:
      return { key: 'confirmFieldPeriodDurationDaily' };
    case WEEK:
      return { key: 'confirmFieldPeriodDurationWeekly' };
    case FORTNIGHT:
      return { key: 'confirmFieldPeriodDurationBiWeekly' };
    case MONTH:
      return { key: 'confirmFieldPeriodDurationMonthly' };
    case YEAR:
      return { key: 'confirmFieldPeriodDurationYearly' };
    default:
      return {
        key: 'confirmFieldPeriodDurationSeconds',
        args: [periodSeconds],
      };
  }
}

/**
 * Converts milliseconds to seconds.
 *
 * @param milliseconds - The milliseconds to convert.
 * @returns The seconds.
 */
export function convertMillisecondsToSeconds(milliseconds: number): number {
  return milliseconds / SECOND;
}

/**
 * Converts an amount per second to an amount per period.
 *
 * @param amountPerSecond - The amount per second in hexadecimal format.
 * @param period - The period to convert to.
 * @returns The amount per period.
 */
export function convertAmountPerSecondToAmountPerPeriod(
  amountPerSecond: Hex,
  period: 'weekly' | 'monthly' | 'fortnightly' | 'yearly',
): Hex {
  const amountBigInt = hexToBigInt(amountPerSecond);
  switch (period) {
    case 'weekly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(WEEK)),
      );
    case 'monthly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(MONTH)),
      );
    case 'fortnightly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(FORTNIGHT)),
      );
    case 'yearly':
      return bigIntToHex(
        amountBigInt * BigInt(convertMillisecondsToSeconds(YEAR)),
      );
    default:
      throw new Error(`Invalid period: ${period as string}`);
  }
}
