/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase -- sdk_version matches analytics event payload keys */
import createClient from 'openapi-fetch';

import {
  getInitializationContext,
  getSessionBaseProperties,
  mergeSessionProperties,
} from './environment';
import type {
  AnalyticsEventV2,
  SmartAccountsKitFunctionCallParameters,
  SmartAccountsKitFunctionCallPayload,
  SmartAccountsKitFunctionCallProperties,
  SmartAccountsKitBaseProperties,
  paths,
} from './schema';
import { Sender } from './sender';
import { version as sdk_version } from '../../package.json';

/**
 * @param value - Candidate merged base properties.
 * @returns Whether `sdk_version`, `anon_id`, and `platform` are all non-empty strings.
 */
function isCompleteBase(
  value: Partial<SmartAccountsKitBaseProperties>,
): value is SmartAccountsKitBaseProperties {
  return (
    typeof value.sdk_version === 'string' &&
    value.sdk_version.length > 0 &&
    typeof value.anon_id === 'string' &&
    value.anon_id.length > 0 &&
    typeof value.platform === 'string' &&
    value.platform.length > 0
  );
}

/**
 * Deep-clones analytics payloads, stringifying bigint values like `42n` to `"42n"`,
 * so they can be JSON-serialized.
 *
 * @param batch - Batch of analytics events to normalise.
 * @returns Normalised batch of analytics events.
 */
function normalise(batch: AnalyticsEventV2[]): AnalyticsEventV2[] {
  const walk = (value: unknown): unknown => {
    if (typeof value === 'bigint') {
      return `${value}n`;
    }
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => walk(item));
    }
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = walk(child);
    }
    return result;
  };

  return walk(batch) as AnalyticsEventV2[];
}

const METAMASK_ANALYTICS_ENDPOINT =
  'https://mm-sdk-analytics.api.cx.metamask.io/';

export class Analytics {
  private enabled = false;

  private readonly sender: Sender<AnalyticsEventV2>;

  constructor(baseUrl: string) {
    const client = createClient<paths>({ baseUrl });

    const sendFn = async (batch: AnalyticsEventV2[]): Promise<void> => {
      const normalisedBatch = normalise(batch);

      const res = await client.POST('/v2/events', { body: normalisedBatch });
      if (res.response.status !== 200) {
        throw new Error(String(res.error));
      }
    };

    // timeouts are unref'd to avoid keeping the process alive. This allows us to use longer, and more timeouts.
    this.sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 100,
      maxFailureCount: 6,
      maxTimeoutMs: 10_000,
      sendFn,
    });
  }

  public enable(): void {
    this.enabled = true;
  }

  /**
   * Merges a field into the session base (shared with {@link getSessionBaseProperties}).
   *
   * @param key - Base property name.
   * @param value - Value for that property.
   */
  public setGlobalProperty<K extends keyof SmartAccountsKitBaseProperties>(
    key: K,
    value: SmartAccountsKitBaseProperties[K],
  ): void {
    mergeSessionProperties({
      [key]: value,
    } as Partial<SmartAccountsKitBaseProperties>);
  }

  /**
   * Sends `smart_accounts_kit_initialized` using the session base from {@link getInitializationContext}
   * plus optional per-event overrides. Updates the stored session with the merged snapshot.
   *
   * @param properties - Optional overrides; omit to use the current session base only.
   */
  public trackInitialized(
    properties: Partial<SmartAccountsKitBaseProperties> = {},
  ): void {
    if (!this.enabled) {
      return;
    }

    const merged: Partial<SmartAccountsKitBaseProperties> = {
      ...getSessionBaseProperties(),
      ...properties,
    };

    if (!isCompleteBase(merged)) {
      throw new Error(
        'Analytics: trackInitialized produced incomplete base configuration (ensure getInitializationContext ran and sdk_version, anon_id, platform are set)',
      );
    }

    mergeSessionProperties(merged);

    const event: AnalyticsEventV2 = {
      namespace: 'metamask/smart-accounts-kit',
      event_name: 'smart_accounts_kit_initialized',
      properties: merged,
    };

    this.sender.enqueue(event);
  }

  /**
   * Sends `smart_accounts_kit_function_called` with session base plus the function name and optional
   * non-sensitive parameters. Does not mutate the session store (unlike {@link trackInitialized}).
   *
   * @param functionName - Public SDK entry name (use a stable string, e.g. `createDelegation`).
   * @param parameters - Safe primitives only; omit secrets, keys, and raw addresses if sensitive.
   * @param baseOverrides - Optional overrides for base fields (same as {@link trackInitialized}).
   */
  public trackSdkFunctionCall(
    functionName: string,
    parameters?: SmartAccountsKitFunctionCallParameters,
    baseOverrides: Partial<SmartAccountsKitBaseProperties> = {},
  ): void {
    if (!this.enabled) {
      return;
    }

    const mergedBase: Partial<SmartAccountsKitBaseProperties> = {
      ...getSessionBaseProperties(),
      ...baseOverrides,
    };

    if (!isCompleteBase(mergedBase)) {
      throw new Error(
        'Analytics: trackSdkFunctionCall requires session (call getInitializationContext before tracking)',
      );
    }

    const props: SmartAccountsKitFunctionCallProperties = {
      ...mergedBase,
      function_name: functionName,
      ...(parameters !== undefined && Object.keys(parameters).length > 0
        ? { parameters }
        : {}),
    };

    const event: SmartAccountsKitFunctionCallPayload = {
      namespace: 'metamask/smart-accounts-kit',
      event_name: 'smart_accounts_kit_function_called',
      properties: props,
    };

    this.sender.enqueue(event);
  }
}

const analytics = new Analytics(METAMASK_ANALYTICS_ENDPOINT);

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

let hasBootstrapped = false;

/**
 * One-time internal setup: session base (stable anon_id, platform, domain), enable client,
 * emit `smart_accounts_kit_initialized`. No-op when `DO_NOT_TRACK` is `true`.
 *
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

/**
 * Records `smart_accounts_kit_function_called` when analytics is enabled and session exists.
 * Pass only non-sensitive primitive fields in `parameters`.
 *
 * On the first call, runs one-time analytics bootstrap (session + **initialized** event) when allowed.
 *
 * @param functionName - Stable SDK entry identifier (e.g. `createDelegation`, `aggregateSignature`).
 * @param parameters - Optional safe argument metadata; use camelCase keys, no secrets or PII.
 */
export function trackSmartAccountsKitFunctionCall(
  functionName: string,
  parameters?: SmartAccountsKitFunctionCallParameters,
): void {
  ensureSmartAccountsKitAnalyticsBootstrapped();
  try {
    analytics.trackSdkFunctionCall(functionName, parameters);
    // eslint-disable-next-line no-empty
  } catch {}
}
