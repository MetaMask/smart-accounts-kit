/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-syntax */
import createClient from 'openapi-fetch';

import {
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
import Sender from './sender';

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

export class Analytics {
  private enabled = false;

  private readonly sender: Sender<AnalyticsEventV2>;

  constructor(baseUrl: string) {
    const client = createClient<paths>({ baseUrl });

    const sendFn = async (batch: AnalyticsEventV2[]): Promise<void> => {
      const res = await client.POST('/v2/events', { body: batch });
      if (res.response.status !== 200) {
        throw new Error(String(res.error));
      }
    };

    this.sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 200,
      maxFailureCount: 10,
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

/** Default MetaMask SDK analytics API base URL. */
export const METAMASK_ANALYTICS_ENDPOINT =
  'https://mm-sdk-analytics.api.cx.metamask.io/';

export {
  getInitializationContext,
  getSessionBaseProperties,
  isAnalyticsSessionStarted,
  mergeSessionProperties,
  resetAnalyticsSessionForTests,
  type GetInitializationContextParams,
} from './environment';
export type {
  AnalyticsEventV2,
  SmartAccountsKitFunctionCallParameters,
  SmartAccountsKitFunctionCallPayload,
  SmartAccountsKitFunctionCallProperties,
  SmartAccountsKitBaseProperties,
  SmartAccountsKitInitializedProperties,
  SmartAccountsKitPayload,
} from './schema';
