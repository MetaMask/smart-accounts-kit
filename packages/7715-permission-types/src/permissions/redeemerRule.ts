import type { Hex } from '../types';

/**
 * Execution permission rule restricting which addresses may redeem the delegation
 * (on-chain RedeemerEnforcer caveat).
 */
export type RedeemerRule = {
  type: 'redeemer';
  data: {
    addresses: Hex[];
  };
};
