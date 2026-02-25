import type { Caveat, SmartAccountsEnvironment } from '../types';

type CaveatWithOptionalArgs = Omit<Caveat, 'args'> & {
  args?: Caveat['args'];
};

const INSECURE_UNRESTRICTED_DELEGATION_ERROR_MESSAGE =
  'No caveats found. If you definitely want to create an empty caveat collection, set `allowInsecureUnrestrictedDelegation` to `true`.';

type CaveatBuilderMap = {
  [key: string]: (
    environment: SmartAccountsEnvironment,
    ...args: [...any]
  ) => Caveat;
};

export type CaveatBuilderConfig = {
  allowInsecureUnrestrictedDelegation?: boolean;
};

/**
 * A builder class for creating and managing caveats.
 *
 * @template TCaveatBuilderMap - The type map of available caveat builder functions.
 */
export class CaveatBuilder<
  TCaveatBuilderMap extends CaveatBuilderMap = Record<string, never>,
> {
  #results: Caveat[] = [];

  #hasBeenBuilt = false;

  readonly #environment: SmartAccountsEnvironment;

  readonly #config: CaveatBuilderConfig;

  readonly #enforcerBuilders: TCaveatBuilderMap;

  constructor(
    environment: SmartAccountsEnvironment,
    config: CaveatBuilderConfig = {},
    enforcerBuilders: TCaveatBuilderMap = {} as TCaveatBuilderMap,
    builtCaveats: Caveat[] = [],
  ) {
    this.#environment = environment;
    this.#config = config;
    this.#enforcerBuilders = enforcerBuilders;
    this.#results = builtCaveats;
  }

  /**
   * Extends the CaveatBuilder with a new enforcer function.
   *
   * @template TEnforcerName - The name of the enforcer.
   * @template TFunction - The type of the enforcer function.
   * @param name - The name of the enforcer.
   * @param fn - The enforcer function.
   * @returns The extended CaveatBuilder instance.
   */
  extend<
    TEnforcerName extends string,
    TFunction extends (
      environment: SmartAccountsEnvironment,
      config: any,
    ) => Caveat,
  >(
    name: TEnforcerName,
    fn: TFunction,
  ): CaveatBuilder<TCaveatBuilderMap & Record<TEnforcerName, TFunction>> {
    return new CaveatBuilder<
      TCaveatBuilderMap & Record<TEnforcerName, TFunction>
    >(
      this.#environment,
      this.#config,
      { ...this.#enforcerBuilders, [name]: fn },
      this.#results,
    );
  }

  /**
   * Adds a caveat directly using a Caveat object.
   *
   * @param caveat - The caveat to add.
   * @returns The CaveatBuilder instance for chaining.
   */
  addCaveat(caveat: CaveatWithOptionalArgs): CaveatBuilder<TCaveatBuilderMap>;

  /**
   * Adds a caveat using a named enforcer function.
   *
   * @param name - The name of the enforcer function to use.
   * @param config - The configuration to pass to the enforcer function.
   * @returns The CaveatBuilder instance for chaining.
   */
  addCaveat<TEnforcerName extends keyof TCaveatBuilderMap>(
    name: TEnforcerName,
    config: Parameters<TCaveatBuilderMap[TEnforcerName]>[1],
  ): CaveatBuilder<TCaveatBuilderMap>;

  addCaveat<TEnforcerName extends keyof TCaveatBuilderMap>(
    nameOrCaveat: TEnforcerName | CaveatWithOptionalArgs,
    config?: Parameters<TCaveatBuilderMap[TEnforcerName]>[1],
  ): CaveatBuilder<TCaveatBuilderMap> {
    if (typeof nameOrCaveat === 'object') {
      const caveat = {
        args: '0x00' as const,
        ...nameOrCaveat,
      };

      this.#results = [...this.#results, caveat];

      return this;
    }
    const name = nameOrCaveat;

    const func = this.#enforcerBuilders[name];
    if (typeof func === 'function') {
      const result = func(this.#environment, config);

      this.#results = [...this.#results, result];

      return this;
    }
    throw new Error(`Function "${String(name)}" does not exist.`);
  }

  /**
   * Returns the caveats that have been built using this CaveatBuilder.
   *
   * @returns The array of built caveats.
   * @throws Error if the builder has already been built or if no caveats are found and empty caveats are not allowed.
   */
  build(): Caveat[] {
    if (this.#hasBeenBuilt) {
      throw new Error('This CaveatBuilder has already been built.');
    }

    if (
      this.#results.length === 0 &&
      !this.#config.allowInsecureUnrestrictedDelegation
    ) {
      throw new Error(INSECURE_UNRESTRICTED_DELEGATION_ERROR_MESSAGE);
    }

    this.#hasBeenBuilt = true;

    return this.#results;
  }
}
