import type { Hex } from '../types';

/**
 * Execution permission rule restricting which addresses may receive payments
 * (on-chain AllowedCalldataEnforcer / AllowedTargetsEnforcer caveat).
 */
export type PayeeRule = {
  type: 'payee';
  data: {
    addresses: Hex[];
  };
};
