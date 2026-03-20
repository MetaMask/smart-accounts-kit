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
 * Whether Do Not Track (browser or `DO_NOT_TRACK` in Node) disables analytics.
 *
 * @returns True when DNT is enabled.
 */
function isAnalyticsDisabled(): boolean {
  let dntIndicator: string | undefined;
  /* eslint-disable no-restricted-globals */
  if (typeof window === 'undefined') {
    dntIndicator = process?.env?.DO_NOT_TRACK;
  } else {
    dntIndicator =
      navigator.doNotTrack ?? (window as { doNotTrack?: string }).doNotTrack;
  }
  /* eslint-enable no-restricted-globals */

  return (
    dntIndicator === '1' || dntIndicator === 'yes' || dntIndicator === 'true'
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
  analytics.trackSdkFunctionCall(functionName, parameters);
}

let hasBootstrapped = false;

/**
 * One-time internal setup: session base (stable anon_id, platform, domain), enable client,
 * emit `smart_accounts_kit_initialized`. No-op when `DO_NOT_TRACK` is `true`.
 *
 * Kit source files should import the same singleton: `import { analytics } from '@metamask/smart-accounts-kit-analytics'`.
 * Do not use `setGlobalProperty` before {@link getInitializationContext} — session must exist first.
 */
export function ensureSmartAccountsKitAnalyticsBootstrapped(): void {
  if (hasBootstrapped) {
    return;
  }

  hasBootstrapped = true;

  if (isAnalyticsDisabled()) {
    return;
  }

  getInitializationContext({ sdk_version });

  analytics.enable();
  analytics.trackInitialized();
}
