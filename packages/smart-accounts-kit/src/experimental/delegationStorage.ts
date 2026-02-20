import { type Hex, toHex } from 'viem';

import { hashDelegation } from '../delegation';
import type { Delegation } from '../types';

type ErrorResponse = {
  error: string;
  data?: any;
};

export type APIStoreDelegationResponse = {
  delegationHash: Hex;
};

/**
 * Represents the allowed filters when querying the data store for delegations.
 */
export enum DelegationStoreFilter {
  Given = 'GIVEN',
  Received = 'RECEIVED',
  All = 'ALL',
}

/**
 * Public Delegation Storage Service environments. To be used in the
 * DeleGationStorageService config.
 */
export const DelegationStorageEnvironment: {
  [K in 'dev' | 'prod']: Environment;
} = {
  dev: { apiUrl: 'https://passkeys.dev-api.cx.metamask.io' },
  prod: { apiUrl: 'https://passkeys.api.cx.metamask.io' },
};

export type Environment = {
  apiUrl: string;
};

export type DelegationStorageConfig = {
  apiKey: string;
  apiKeyId: string;
  environment: Environment;
  fetcher?: typeof fetch;
};

export class DelegationStorageClient {
  readonly #apiVersionPrefix = 'api/v0';

  readonly #config: DelegationStorageConfig;

  readonly #fetcher: typeof fetch;

  readonly #apiUrl: string;

  constructor(config: DelegationStorageConfig) {
    const { apiUrl } = config.environment;

    if (apiUrl.endsWith(this.#apiVersionPrefix)) {
      this.#apiUrl = apiUrl;
    } else {
      const separator = apiUrl.endsWith('/') ? '' : '/';
      this.#apiUrl = `${apiUrl}${separator}${this.#apiVersionPrefix}`;
    }
    this.#fetcher = this.#initializeFetcher(config);
    this.#config = config;
  }

  /**
   * Initializes the fetch function for HTTP requests.
   *
   * - Uses `config.fetcher` if provided.
   * - Falls back to global `fetch` if available.
   * - Throws an error if no fetch function is available.
   *
   * @param config - Configuration object that may include a custom fetch function.
   * @returns The fetch function to be used for HTTP requests.
   * @throws Error if no fetch function is available in the environment.
   */
  #initializeFetcher(config: DelegationStorageConfig): typeof fetch {
    if (config.fetcher) {
      return config.fetcher;
    } else if (typeof globalThis?.fetch === 'function') {
      return globalThis.fetch.bind(globalThis);
    }
    throw new Error(
      'Fetch API is not available in this environment. Please provide a fetch function in the config.',
    );
  }

  /**
   * Fetches the delegation chain from the Delegation Storage Service, ending with
   * the specified leaf delegation.
   *
   * @param leafDelegationOrDelegationHash - The leaf delegation, or the hash
   * of the leaf delegation.
   * @returns A promise that resolves to the delegation chain - empty array if the delegation
   * is not found.
   */
  async getDelegationChain(
    leafDelegationOrDelegationHash: Hex | Delegation,
  ): Promise<Delegation[]> {
    const leafDelegationHash =
      typeof leafDelegationOrDelegationHash === 'string'
        ? leafDelegationOrDelegationHash
        : hashDelegation(leafDelegationOrDelegationHash);

    const response = await this.#fetcher(
      `${this.#apiUrl}/delegation/chain/${leafDelegationHash}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.#config.apiKey}`,
          'x-api-key-id': this.#config.apiKeyId,
        },
      },
    );

    const responseData: Delegation[] | ErrorResponse = await response.json();

    if ('error' in responseData) {
      throw new Error(
        `Failed to fetch delegation chain: ${responseData.error}`,
      );
    }

    return responseData;
  }

  /**
   * Fetches the delegations from the Delegation Storage Service, either `Received`
   * by, or `Given` by, (or both: `All`) the specified deleGatorAddress. Defaults
   * to `Received`.
   *
   * @param deleGatorAddress - The deleGatorAddress to retrieve the delegations for.
   * @param filterMode - The DelegationStoreFilter mode - defaults to Received.
   * @returns A promise that resolves to the list of delegations received by the deleGatorAddress,
   * empty array if the delegations are not found.
   */
  async fetchDelegations(
    deleGatorAddress: Hex,
    filterMode = DelegationStoreFilter.Received,
  ): Promise<Delegation[]> {
    const response = await this.#fetcher(
      `${this.#apiUrl}/delegation/accounts/${deleGatorAddress}?filter=${filterMode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.#config.apiKey}`,
          'x-api-key-id': this.#config.apiKeyId,
        },
      },
    );

    const responseData: Delegation[] | ErrorResponse = await response.json();

    if ('error' in responseData) {
      throw new Error(`Failed to fetch delegations: ${responseData.error}`);
    }

    return responseData;
  }

  /**
   * Stores the specified delegation in the Delegation Storage Service.
   *
   * @param delegation - The delegation to store.
   * @returns A promise that resolves to the delegation hash indicating successful storage.
   */
  async storeDelegation(delegation: Delegation): Promise<Hex> {
    if (!delegation.signature || delegation.signature === '0x') {
      throw new Error('Delegation must be signed to be stored');
    }

    const delegationHash = hashDelegation(delegation);

    const body = JSON.stringify(
      {
        ...delegation,
        metadata: [],
      },
      (_, value: any) =>
        typeof value === 'bigint' || typeof value === 'number'
          ? toHex(value)
          : value,
      2,
    );

    const response = await this.#fetcher(`${this.#apiUrl}/delegation/store`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#config.apiKey}`,
        'x-api-key-id': this.#config.apiKeyId,
        'Content-Type': 'application/json',
      },
      body,
    });

    const responseData: APIStoreDelegationResponse | ErrorResponse =
      await response.json();

    if ('error' in responseData) {
      throw new Error(responseData.error);
    }

    if (responseData.delegationHash !== delegationHash) {
      throw Error(
        'Failed to store the Delegation, the hash returned from the MM delegation storage API does not match the hash of the delegation',
      );
    }

    return responseData.delegationHash;
  }
}
