import { NativeTokenStreamingEnforcer } from '@metamask/delegation-abis';
import type { Address, Client, Hex } from 'viem';
import { readContract, getBlock } from 'viem/actions';

export type ReadGetAvailableAmountParameters = {
  client: Client;
  contractAddress: Address;
  delegationManager: Address;
  delegationHash: Hex;
  terms: Hex;
};

export const read = async ({
  client,
  contractAddress,
  delegationManager,
  delegationHash,
  terms,
}: ReadGetAvailableAmountParameters) => {
  // Get current block timestamp from blockchain
  const currentBlock = await getBlock(client);
  const currentTimestamp = currentBlock.timestamp;

  // First, get the current state from the contract
  const allowanceState = await readContract(client, {
    address: contractAddress,
    abi: NativeTokenStreamingEnforcer,
    functionName: 'streamingAllowances',
    args: [delegationManager, delegationHash],
  });

  const [initialAmount, maxAmount, amountPerSecond, startTime, spent] =
    allowanceState;

  // Check if state exists (startTime != 0)
  if (startTime !== 0n) {
    // State exists, calculate available amount using the stored state
    const availableAmount = getAvailableAmount({
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
      spent,
      currentTimestamp,
    });

    return {
      availableAmount,
    };
  }

  // State doesn't exist, decode terms and simulate with spent = 0
  const decodedTerms = await readContract(client, {
    address: contractAddress,
    abi: NativeTokenStreamingEnforcer,
    functionName: 'getTermsInfo',
    args: [terms],
  });

  const [
    decodedInitialAmount,
    decodedMaxAmount,
    decodedAmountPerSecond,
    decodedStartTime,
  ] = decodedTerms;

  // Simulate using decoded terms with spent = 0
  const availableAmount = getAvailableAmount({
    initialAmount: decodedInitialAmount,
    maxAmount: decodedMaxAmount,
    amountPerSecond: decodedAmountPerSecond,
    startTime: decodedStartTime,
    spent: 0n,
    currentTimestamp,
  });

  return {
    availableAmount,
  };
};

/**
 * Replicates the internal _getAvailableAmount logic from the smart contract.
 *
 * @param allowance - The allowance object containing all parameters.
 * @param allowance.initialAmount - The initial amount available.
 * @param allowance.maxAmount - The maximum amount allowed.
 * @param allowance.amountPerSecond - The amount streamed per second.
 * @param allowance.startTime - The start time of the streaming.
 * @param allowance.spent - The amount already spent.
 * @param allowance.currentTimestamp - The current timestamp.
 * @returns The available amount that can be spent.
 */
function getAvailableAmount(allowance: {
  initialAmount: bigint;
  maxAmount: bigint;
  amountPerSecond: bigint;
  startTime: bigint;
  spent: bigint;
  currentTimestamp: bigint;
}): bigint {
  // If current time is before start time, nothing is available
  if (allowance.currentTimestamp < allowance.startTime) {
    return 0n;
  }

  // Calculate elapsed time since start
  const elapsed = allowance.currentTimestamp - allowance.startTime;

  // Calculate total unlocked amount
  let unlocked = allowance.initialAmount + allowance.amountPerSecond * elapsed;

  // Cap by max amount
  if (unlocked > allowance.maxAmount) {
    unlocked = allowance.maxAmount;
  }

  // If spent >= unlocked, nothing available
  if (allowance.spent >= unlocked) {
    return 0n;
  }

  // Return available amount
  return unlocked - allowance.spent;
}
