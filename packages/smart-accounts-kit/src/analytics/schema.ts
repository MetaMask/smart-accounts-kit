/* eslint-disable @typescript-eslint/naming-convention -- Analytics API field names */
/**
 * Types for MetaMask SDK analytics `/v2/events` payloads used by the Smart Accounts Kit.
 */

/** Fields merged into every Smart Accounts Kit analytics event (set via globals and/or `trackInitialized`). */
export type SmartAccountsKitBaseProperties = {
  /** @description Version of the SDK. */
  sdk_version: string;
  /**
   * Format: uuid
   *
   * @description Anonymous identifier for the user or session.
   */
  anon_id: string;
  /**
   * @description Platform on which the SDK is running.
   */
  platform:
    | 'web-desktop'
    | 'web-mobile'
    | 'nodejs'
    | 'in-app-browser'
    | 'react-native';
  /**
   * @description Browser hostname (e.g. from `location.hostname`) when `platform` is `web-desktop`.
   * Omitted in other platforms and when the hostname is not available.
   */
  domain?: string;
};

/** @alias {@link SmartAccountsKitBaseProperties} — same shape as the initialization payload. */
export type SmartAccountsKitInitializedProperties =
  SmartAccountsKitBaseProperties;

export type SmartAccountsKitPayload = {
  namespace: 'metamask/smart-accounts-kit';
  event_name: 'smart_accounts_kit_initialized';
  properties: SmartAccountsKitBaseProperties;
};

/** Non-sensitive primitive fields only; callers must not pass secrets or PII. */
export type SmartAccountsKitFunctionCallParameters = Record<string, unknown>;

export type SmartAccountsKitFunctionCallProperties =
  SmartAccountsKitBaseProperties & {
    /** Exported SDK function name (e.g. `createDelegation`, `sendUserOperationWithDelegationAction`). */
    function_name: string;
    /** Optional safe subset of call arguments. */
    parameters?: SmartAccountsKitFunctionCallParameters;
  };

export type SmartAccountsKitFunctionCallPayload = {
  namespace: 'metamask/smart-accounts-kit';
  event_name: 'smart_accounts_kit_function_called';
  properties: SmartAccountsKitFunctionCallProperties;
};

export type AnalyticsEventV2 =
  | SmartAccountsKitPayload
  | SmartAccountsKitFunctionCallPayload;

export type paths = {
  '/v2/events': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': AnalyticsEventV2[];
        };
      };
      responses: {
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': {
              status?: string;
            };
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
