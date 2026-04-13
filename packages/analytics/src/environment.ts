/* eslint-disable @typescript-eslint/naming-convention -- analytics payload field names */
import type { SmartAccountsKitBaseProperties } from './schema';

export type GetInitializationContextParams = {
  /**
   * Smart Accounts Kit (or embedding SDK) version, e.g. from the host `package.json`.
   */
  sdk_version: string;
  /**
   * Anonymous session identifier for this SDK instance / page lifecycle.
   * If omitted on the **first** call, a UUID is generated and reused for the whole session.
   * Ignored on later calls (first `anon_id` wins).
   */
  anon_id?: string;
};

/** One analytics session per JS runtime / page load / Node process import lifecycle. */
let session: SmartAccountsKitBaseProperties | undefined;

/**
 * @returns A UUID when `crypto.randomUUID` exists; otherwise a UUID-shaped fallback string.
 */
function createAnonId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Math.random()
    .toString(16)
    .slice(2, 14)
    .padEnd(12, '0')}`;
}

/**
 * @returns Connect-style `platform` for the current JS runtime (browser vs Node).
 */
function inferPlatform(): SmartAccountsKitBaseProperties['platform'] {
  if (typeof globalThis === 'undefined' || !('window' in globalThis)) {
    return 'nodejs';
  }
  const nav = (globalThis as Window & typeof globalThis).navigator;
  const ua = typeof nav?.userAgent === 'string' ? nav.userAgent : '';
  if (
    /Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/iu.test(ua)
  ) {
    return 'web-mobile';
  }
  return 'web-desktop';
}

/**
 * @returns `{ domain: hostname }` in a browser when `location.hostname` is set; otherwise `{}`.
 */
function inferDomain(): Pick<SmartAccountsKitBaseProperties, 'domain'> {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    const win = globalThis as Window & typeof globalThis;
    const hostname = win.location?.hostname;
    if (typeof hostname === 'string' && hostname.length > 0) {
      return { domain: hostname };
    }
  }
  return {};
}

/**
 * Starts or updates the SDK analytics session and returns the current base properties snapshot.
 * First call allocates a stable `anon_id`, infers `platform` and optional `domain`, and stores `sdk_version`.
 * Later calls reuse `anon_id`, `platform`, and `domain`; `sdk_version` is updated from params.
 *
 * @param params - At minimum `sdk_version` each time you call (typically your kit version).
 * @returns A copy of the session base; use {@link getSessionBaseProperties} for subsequent reads.
 */
export function getInitializationContext(
  params: GetInitializationContextParams,
): SmartAccountsKitBaseProperties {
  if (!session) {
    session = {
      sdk_version: params.sdk_version,
      anon_id: params.anon_id ?? createAnonId(),
      platform: inferPlatform(),
      ...inferDomain(),
    };
    return { ...session };
  }

  session = {
    ...session,
    sdk_version: params.sdk_version,
  };
  return { ...session };
}

/**
 * Current session base (`sdk_version`, stable `anon_id`, `platform`, optional `domain`).
 * Call {@link getInitializationContext} once at startup before recording events.
 *
 * @returns A shallow copy of the stored base properties.
 */
export function getSessionBaseProperties(): SmartAccountsKitBaseProperties {
  if (!session) {
    throw new Error(
      'Smart Accounts Kit analytics: call getInitializationContext({ sdk_version }) at SDK startup before recording events.',
    );
  }
  return { ...session };
}

/**
 * Merges fields into the session base (e.g. {@link import('./analytics').default.setGlobalProperty}).
 *
 * @param partial - Properties to merge over the current session.
 */
export function mergeSessionProperties(
  partial: Partial<SmartAccountsKitBaseProperties>,
): void {
  if (!session) {
    throw new Error(
      'Smart Accounts Kit analytics: call getInitializationContext before mergeSessionProperties.',
    );
  }
  session = { ...session, ...partial };
}

/**
 * @returns Whether a session has been started with {@link getInitializationContext}.
 */
export function isAnalyticsSessionStarted(): boolean {
  return session !== undefined;
}

/**
 * Clears the session (for tests only).
 */
export function resetAnalyticsSessionForTests(): void {
  session = undefined;
}
