import { DelegationManager } from '@metamask/delegation-abis';
import { encodeFunctionData } from 'viem';
import type { Address, Hex } from 'viem';

import type { DelegatedCall } from './actions/erc7710RedeemDelegationAction';
import {
  execute,
  executeWithMode,
} from './DelegationFramework/DeleGatorCore/encode';
import {
  ExecutionMode,
  createExecution,
  encodeExecutionCalldatas,
} from './executions';
import type { Call } from './types';

/**
 * Checks if a call is a delegated call by checking for the presence of permissionsContext and delegationManager.
 *
 * @param call - The call to check.
 * @returns True if the call is a delegated call, false otherwise.
 */
const isDelegatedCall = (call: Call): call is DelegatedCall => {
  return 'permissionsContext' in call && 'delegationManager' in call;
};

/**
 * If there's a single call with permissionsContext and delegationManager,
 * processes it as a delegated call.
 *
 * @param call - The call to process.
 * @returns The execution object for the delegated call.
 * @description
 * This function creates an execution that calls redeemDelegations on the delegation manager.
 */
const processDelegatedCall = (call: DelegatedCall) => {
  const {
    permissionsContext,
    delegationManager,
    to: target,
    value,
    data: callData,
  } = call;

  const callAsExecution = createExecution({ target, value, callData });

  if (!permissionsContext) {
    return callAsExecution;
  }

  const redeemCalldata = encodeFunctionData({
    abi: DelegationManager.abi,
    functionName: 'redeemDelegations',
    args: [
      [permissionsContext],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([[callAsExecution]]),
    ],
  });

  return createExecution({
    target: delegationManager,
    callData: redeemCalldata,
  });
};

/**
 * If there's a single call, encode the shorthand `execute` function. Otherwise, encode the `executeWithMode` function. Execution type will always be "default".
 *
 * @param calls - The calls to execute.
 * @returns The encoded calldata for the DeleGator to execute the calls.
 * @description
 * This function supports both single and batch execution modes.
 * For single calls, it uses the gas-efficient execute function.
 */
export const encodeCalls = (calls: readonly Call[]) => {
  if (calls.length === 1) {
    const call = calls[0];
    if (call && !isDelegatedCall(call)) {
      const { to: target, value, data: callData } = call;
      const execution = createExecution({ target, value, callData });
      return execute({ execution });
    }
  }

  const executions = calls.map((call) => {
    if (isDelegatedCall(call)) {
      return processDelegatedCall(call);
    }
    const { to: target, value, data: callData } = call;
    return createExecution({ target, value, callData });
  });

  const mode =
    calls.length === 1
      ? ExecutionMode.SingleDefault
      : ExecutionMode.BatchDefault;
  return executeWithMode({ mode, executions });
};

/**
 * Encodes calls for execution by a DeleGator smart contract.
 *
 * @param caller - The address of the DeleGator contract.
 * @param calls - An array of Call objects, each containing 'to', optional 'data', and optional 'value'.
 * @returns A promise that resolves to the encoded function data as a hexadecimal string.
 * @description
 * - If there's a single call directly to the delegator, it returns the call data directly.
 * - For multiple calls or calls to other addresses, it creates executions and encodes them for the DeleGator's execute function.
 * - The execution mode is set to ExecutionMode.SingleDefault for a single call, or ExecutionMode.BatchDefault for multiple calls.
 *
 * todo: This doesn't fully expose the flexibility of the DeleGator's execute function, but it's a start.
 * maybe we add a mechanism where individual calls passed to this function can be encoded batches.
 */
export const encodeCallsForCaller = async (
  caller: Address,
  calls: readonly Call[],
): Promise<Hex> => {
  if (calls.length === 1) {
    const call = calls[0];
    if (call && call.to === caller && !isDelegatedCall(call)) {
      // if there's a single call, and it's to the delegator, we can just return the calldata directly.
      return call.data ?? '0x';
    }
  }
  return encodeCalls(calls);
};
