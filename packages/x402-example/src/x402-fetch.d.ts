import type { x402Client, x402HTTPClient } from '@x402/core/client';

declare module '@x402/fetch' {
  export function wrapFetchWithPayment(
    fetchImpl: typeof globalThis.fetch,
    client: x402Client | x402HTTPClient,
  ): typeof globalThis.fetch;
}
