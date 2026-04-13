/* eslint-disable @typescript-eslint/naming-convention -- process.env */
/* eslint-disable camelcase -- sdk_version matches analytics event payload keys */
import {
  Analytics,
  METAMASK_ANALYTICS_ENDPOINT,
  getInitializationContext,
  type SmartAccountsKitFunctionCallParameters,
} from '@metamask/smart-accounts-kit-analytics';

import { version as sdk_version } from '../package.json';

/**
 * Whether CI or Do Not Track disables analytics.
 *
 * Collects every available indicator (`CI` when `process.env` exists,
 * `DO_NOT_TRACK` when `process.env` exists, `navigator.doNotTrack` and
 * `window.doNotTrack` when `window` exists) and disables if any value
 * is `1`, `yes`, or `true`.
 *
 * @returns True when analytics should not run.
 */
function isAnalyticsDisabled(): boolean {
  const dntValues: (string | undefined | null)[] = [];

  /* eslint-disable no-restricted-globals */
  if (typeof process !== 'undefined') {
    dntValues.push(process.env?.CI);

    dntValues.push(process.env?.DO_NOT_TRACK);
  }

  if (typeof navigator !== 'undefined') {
    dntValues.push(navigator.doNotTrack);
  }

  if (typeof window !== 'undefined') {
    dntValues.push((window as { doNotTrack?: string }).doNotTrack);
  }
  /* eslint-enable no-restricted-globals */

  return dntValues.some(
    (dntValue) =>
      dntValue === '1' ||
      dntValue?.toLowerCase() === 'yes' ||
      dntValue?.toLowerCase() === 'true',
  );
}

export const analytics = new Analytics(METAMASK_ANALYTICS_ENDPOINT);

/**
 * Records `smart_accounts_kit_function_called` when analytics is enabled and session exists.
 * Pass only non-sensitive primitive fields in `parameters`.
 *
 * @param functionName - Stable SDK entry identifier (e.g. `createDelegation`, `aggregateSignature`).
 * @param parameters - Optional safe argument metadata; use camelCase keys, no secrets or PII.
 */
export function trackSmartAccountsKitFunctionCall(
  functionName: string,
  parameters?: SmartAccountsKitFunctionCallParameters,
): void {
  try {
    analytics.trackSdkFunctionCall(functionName, parameters);
    // eslint-disable-next-line no-empty
  } catch {}
}

let hasBootstrapped = false;

/**
 * One-time internal setup: session base (stable anon_id, platform, domain), enable client,
 * emit `smart_accounts_kit_initialized`. No-op when `DO_NOT_TRACK` is `true`.
 *
 * Kit source files should import the same singleton: `import { analytics } from '@metamask/smart-accounts-kit-analytics'`.
 * Do not use `setGlobalProperty` before {@link getInitializationContext} — session must exist first.
 */
function ensureSmartAccountsKitAnalyticsBootstrapped(): void {
  if (hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;

  if (isAnalyticsDisabled()) {
    return;
  }

  try {
    getInitializationContext({ sdk_version });
    analytics.enable();
    analytics.trackInitialized();
    // eslint-disable-next-line no-empty
  } catch {}
}

// execute this function simply by importing the analytics file
ensureSmartAccountsKitAnalyticsBootstrapped();
