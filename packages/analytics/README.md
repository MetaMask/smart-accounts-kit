# `@metamask/smart-accounts-kit-analytics`

**Private workspace package** — not published to npm. It is **bundled into** `@metamask/smart-accounts-kit` and used **only from that package’s source** (internal telemetry for the kit itself). It is **not** part of the public `@metamask/smart-accounts-kit` API.

### Session base

Module state holds **one session** per process or browser tab: `getSessionBaseProperties()` returns the current base. `getInitializationContext` starts or updates the session (stable `anon_id`, `platform`, optional `domain`). `analytics.setGlobalProperty` / `mergeSessionProperties` update that store; `trackInitialized(overrides?)` merges session + overrides, persists the result, and sends `smart_accounts_kit_initialized`. `trackSdkFunctionCall(functionName, parameters?)` sends `smart_accounts_kit_function_called` with the same base properties plus `function_name` and optional non-sensitive `parameters` (does not update the session store).

The package exports the default **`METAMASK_ANALYTICS_ENDPOINT`** URL, the **`Analytics`** class, and schema/session helpers from **`index.ts`**.

## Contributing

This package is part of the [smart-accounts-kit](https://github.com/metamask/smart-accounts-kit) monorepo.
