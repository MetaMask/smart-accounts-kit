import type { CaveatBuilder } from './caveatBuilder';
import {
  createCaveatBuilder,
  type CoreCaveatConfiguration,
} from './coreCaveatBuilder';
import { createCaveatBuilderFromScope, type ScopeConfig } from './scope';
import type { Caveat, SmartAccountsEnvironment } from '../types';

export type Caveats = CaveatBuilder | (Caveat | CoreCaveatConfiguration)[];

/**
 * Resolves the array of Caveat from a Caveats argument.
 *
 * @param config - The configuration for the caveat builder.
 * @param config.environment - The environment to be used for the caveat builder.
 * @param config.scope - The scope to be used for the caveat builder. Optional - when not provided and redelegating, scope is inherited from the parent delegation.
 * @param config.caveats - The caveats to be resolved, which can be either a CaveatBuilder or an array of Caveat or CaveatConfiguration. Optional - if not provided, only scope caveats will be used.
 * @returns The resolved array of caveats.
 */
export const resolveCaveats = ({
  environment,
  scope,
  caveats,
}: {
  environment: SmartAccountsEnvironment;
  scope?: ScopeConfig;
  caveats?: Caveats;
}) => {
  // Create base caveat builder from scope if provided, otherwise use core caveat builder
  const scopeCaveatBuilder = scope
    ? createCaveatBuilderFromScope(environment, scope)
    : createCaveatBuilder(environment, {
        allowInsecureUnrestrictedDelegation: true,
      });

  if (caveats) {
    if ('build' in caveats && typeof caveats.build === 'function') {
      (caveats as CaveatBuilder).build().forEach((caveat) => {
        scopeCaveatBuilder.addCaveat(caveat);
      });
    } else if (Array.isArray(caveats)) {
      caveats.forEach((caveat) => {
        try {
          if ('type' in caveat) {
            const { type, ...config } = caveat;
            (scopeCaveatBuilder as any).addCaveat(type, config);
          } else {
            scopeCaveatBuilder.addCaveat(caveat);
          }
        } catch (error) {
          throw new Error(`Invalid caveat: ${(error as Error).message}`);
        }
      });
    }
  }

  return scopeCaveatBuilder.build();
};
