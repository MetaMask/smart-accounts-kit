import {
  type Address,
  type Hex,
  encodeAbiParameters,
  encodePacked,
} from 'viem';

export type ExecutionStruct = {
  target: Address;
  value: bigint;
  callData: Hex;
};

export type CreateExecutionArgs = {
  target: Address;
  value?: bigint;
  callData?: Hex;
};

/**
 * Creates an execution data structure.
 *
 * @param args - The arguments for creating an execution.
 * @param args.target - The address to invoke some calldata on.
 * @param args.value - ETH to send to the address.
 * @param args.callData - The calldata to invoke on the address.
 * @returns The created execution data structure.
 */
export const createExecution = ({
  target,
  value = 0n,
  callData = '0x',
}: CreateExecutionArgs): ExecutionStruct => ({
  target,
  value,
  callData,
});

// Encoded modes
// https://github.com/erc7579/erc7579-implementation/blob/main/src/lib/ModeLib.sol
export enum ExecutionMode {
  SingleDefault = '0x0000000000000000000000000000000000000000000000000000000000000000',
  SingleTry = '0x0001000000000000000000000000000000000000000000000000000000000000',
  BatchDefault = '0x0100000000000000000000000000000000000000000000000000000000000000',
  BatchTry = '0x0101000000000000000000000000000000000000000000000000000000000000',
}

/**
 * The ABI type components of an Execution.
 */
export const EXECUTION_ABI_TYPE_COMPONENTS = [
  { type: 'address', name: 'target' },
  { type: 'uint256', name: 'value' },
  { type: 'bytes', name: 'callData' },
];

/**
 * Encodes a single Execution. Used for executing a single Execution in a DeleGator SCA.
 *
 * @param execution - The execution to encode.
 * @returns The encoded execution.
 */
export const encodeSingleExecution = (execution: ExecutionStruct): Hex => {
  return encodePacked(
    ['address', 'uint256', 'bytes'],
    [execution.target, execution.value, execution.callData],
  );
};

/**
 * Encodes a batch of Executions. Used for executing a batch of Executions in a DeleGator SCA.
 *
 * @param executions - The executions to encode.
 * @returns The encoded executions.
 */
export const encodeBatchExecution = (executions: ExecutionStruct[]): Hex => {
  return encodeAbiParameters(
    [
      {
        components: EXECUTION_ABI_TYPE_COMPONENTS,
        name: 'executions',
        type: 'tuple[]',
      },
    ],
    [executions],
  );
};

/**
 * Encodes the calldata for interacting with the advanced `execute` DeleGator method.
 *
 * @param executions - The execution(s) to encode.
 * @returns The encoded execution(s).
 */
export const encodeExecutionCalldata = (executions: ExecutionStruct[]): Hex => {
  if (executions.length === 0) {
    throw new Error(
      'Error while getting the execution calldatas, executions is empty',
    );
  }
  if (executions.length === 1) {
    const execution = executions[0];
    if (!execution) {
      throw new Error('Execution not found');
    }
    return encodeSingleExecution(execution);
  }

  return encodeBatchExecution(executions);
};

/**
 * Encodes the calldata for interacting with `redeemDelegations`.
 *
 * @param executionsBatch - The executions to encode.
 * @returns The encoded executions.
 */
export const encodeExecutionCalldatas = (
  executionsBatch: ExecutionStruct[][],
): Hex[] => {
  if (executionsBatch.length === 0) {
    throw new Error(
      'Error while getting the execution calldatas, executionsBatch is empty',
    );
  }
  return executionsBatch.map(encodeExecutionCalldata);
};
