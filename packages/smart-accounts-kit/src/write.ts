import { SimpleFactory, DelegationManager } from '@metamask/delegation-abis';
import type { Address, Chain, Hex, PublicClient, WalletClient } from 'viem';

import { encodePermissionContexts } from './delegation';
import type { ExecutionStruct, ExecutionMode } from './executions';
import { encodeExecutionCalldatas } from './executions';
import type { Delegation, ContractMetaData, Redemption } from './types';

/**
 * Deploys a contract using the SimpleFactory contract.
 *
 * @param walletClient - The wallet client to use for deployment.
 * @param publicClient - The public client to use for simulation.
 * @param simpleFactoryAddress - The address of the SimpleFactory contract.
 * @param creationCode - The creation code for the contract to deploy.
 * @param salt - The salt to use for deterministic deployment.
 * @returns The transaction hash of the deployment.
 */
export const deployWithSimpleFactory = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  simpleFactoryAddress: Address,
  creationCode: Hex,
  salt: Hex,
) => {
  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: simpleFactoryAddress,
    abi: SimpleFactory,
    functionName: 'deploy',
    args: [creationCode, salt],
  });
  return await walletClient.writeContract(request);
};

/**
 * Redeems a delegation to execute the provided executions.
 *
 * @param walletClient - The wallet client to use for redemption.
 * @param publicClient - The public client to use for simulation.
 * @param delegationManagerAddress - The address of the DelegationManager contract.
 * @param redemptions - The redemptions to execute, containing permission contexts, executions, and modes.
 * @returns The transaction hash of the redemption.
 */
export const redeemDelegations = async (
  walletClient: WalletClient,
  publicClient: PublicClient,
  delegationManagerAddress: Address,
  redemptions: Redemption[],
) => {
  if (redemptions.length === 0) {
    throw new Error('RedeemDelegations invalid zero redemptions');
  }

  const permissionContexts: Delegation[][] = [];
  const executionsBatch: ExecutionStruct[][] = [];
  const executionModes: ExecutionMode[] = [];

  redemptions.forEach((redemption) => {
    permissionContexts.push(redemption.permissionContext);
    executionsBatch.push(redemption.executions);
    executionModes.push(redemption.mode);
  });

  const encodedPermissionContexts =
    encodePermissionContexts(permissionContexts);
  const executionCalldatas = encodeExecutionCalldatas(executionsBatch);

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: delegationManagerAddress,
    abi: DelegationManager,
    functionName: 'redeemDelegations',
    args: [encodedPermissionContexts, executionModes, executionCalldatas],
  });
  return await walletClient.writeContract(request);
};

/**
 * Deploys a contract to the blockchain.
 *
 * @param walletClient - The wallet client to use for deployment.
 * @param publicClient - The public client to use for transaction receipt.
 * @param chain - The chain to deploy on.
 * @param contractMetadata - The metadata of the contract to deploy.
 * @param contractMetadata.bytecode - The bytecode of the contract to deploy.
 * @param contractMetadata.abi - The ABI of the contract to deploy.
 * @param args - The constructor arguments for the contract.
 * @returns An object containing the deployed contract address, transaction hash, and receipt.
 */
export async function deployContract(
  walletClient: WalletClient,
  publicClient: PublicClient,
  chain: Chain,
  { bytecode, abi }: ContractMetaData,
  args: any[] = [],
) {
  if (!walletClient.account) {
    throw new Error('Wallet client account is required');
  }

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args,
    account: walletClient.account,
    chain,
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  if (!receipt.contractAddress) {
    throw new Error('No contract address in receipt');
  }

  return { address: receipt.contractAddress, hash, receipt };
}
