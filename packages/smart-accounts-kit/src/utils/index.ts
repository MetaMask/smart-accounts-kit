import { toHex } from 'viem';

export { decodeCaveat } from '../caveats';

export {
  encodeDelegations,
  decodeDelegations,
  encodeDelegation,
  decodeDelegation,
  hashDelegation,
  toDelegationStruct,
  toDelegation,
  DELEGATION_ARRAY_ABI_TYPE,
  DELEGATION_ABI_TYPE,
  DELEGATION_ABI_TYPE_COMPONENTS,
  DELEGATION_TYPEHASH,
  SIGNABLE_DELEGATION_TYPED_DATA,
} from '../delegation';

export type { DelegationStruct } from '../delegation';

export {
  encodeExecutionCalldata,
  encodeExecutionCalldatas,
  encodeSingleExecution,
  encodeBatchExecution,
} from '../executions';

export type { ExecutionStruct } from '../executions';

export type { AuthenticatorFlags } from '../webAuthn';

export { SIGNATURE_ABI_PARAMS } from '../webAuthn';

export { SIGNABLE_USER_OP_TYPED_DATA } from '../userOp';

export { encodeCalls, encodeCallsForCaller } from '../encodeCalls';

export { getCounterfactualAccountData } from '../counterfactualAccountData';

export {
  overrideDeployedEnvironment,
  deploySmartAccountsEnvironment,
} from '../smartAccountsEnvironment';

export type { CoreCaveatBuilder, CaveatBuilderConfig } from '../caveatBuilder';

export { createCaveatBuilder, CaveatBuilder } from '../caveatBuilder';

/**
 * Generates a cryptographically secure random salt.
 *
 * @returns A 32-byte hex salt.
 */
export function generateSalt() {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('Secure randomness is unavailable in this runtime');
  }

  const randomValues = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return toHex(randomValues);
}
