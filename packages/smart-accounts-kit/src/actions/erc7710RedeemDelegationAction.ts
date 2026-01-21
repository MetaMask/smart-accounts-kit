import { DelegationManager } from '@metamask/delegation-abis';
import type {
  Account,
  Chain,
  Hex,
  OneOf,
  PublicClient,
  SendTransactionParameters,
  SendTransactionRequest,
  Transport,
  WalletClient,
} from 'viem';
import { concat, encodeFunctionData, isAddressEqual } from 'viem';
import type {
  BundlerClient,
  SendUserOperationParameters,
  SmartAccount,
} from 'viem/account-abstraction';

import {
  createExecution,
  encodeExecutionCalldatas,
  ExecutionMode,
} from '../executions';
import { getSmartAccountsEnvironment } from '../smartAccountsEnvironment';
import type { Call } from '../types';

export type DelegatedCall = Call &
  OneOf<{ permissionsContext: Hex; delegationManager: Hex } | object>;

export type SendTransactionWithDelegationParameters<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
  TChainOverride extends Chain | undefined = Chain | undefined,
  TRequest extends SendTransactionRequest<TChain, TChainOverride> =
    SendTransactionRequest<TChain, TChainOverride>,
> = SendTransactionParameters<TChain, TAccount, TChainOverride, TRequest> & {
  permissionsContext: Hex;
  delegationManager: Hex;
};

/**
 * Sends a transaction using delegation to execute operations on behalf of another account.
 *
 * @param client - The wallet client to use for sending the transaction.
 * @param args - Transaction parameters with delegation details.
 * @returns Transaction hash of the executed transaction.
 */
export async function sendTransactionWithDelegationAction<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: WalletClient<Transport, TChain, TAccount>,
  args: SendTransactionWithDelegationParameters<TChain, TAccount>,
) {
  if (!args.to) {
    throw new Error(
      '`to` is required. `sendTransactionWithDelegation` cannot be used to deploy contracts.',
    );
  }

  const executions = [
    createExecution({
      target: args.to,
      value: args.value,
      callData: args.data,
    }),
  ];

  const calldata = encodeFunctionData({
    abi: DelegationManager,
    functionName: 'redeemDelegations',
    args: [
      [args.permissionsContext],
      [ExecutionMode.SingleDefault],
      encodeExecutionCalldatas([executions]),
    ],
  });

  const {
    value: _value,
    permissionsContext: _permissionsContext,
    delegationManager: _delegationManager,
    ...rest
  } = args;

  const hash = await client.sendTransaction({
    ...rest,
    to: args.delegationManager,
    data: calldata,
  } as unknown as SendTransactionParameters);

  return hash;
}

export type SendUserOperationWithDelegationParameters<
  TAccount extends SmartAccount | undefined = SmartAccount | undefined,
  TAccountOverride extends SmartAccount | undefined = SmartAccount | undefined,
> = SendUserOperationParameters<TAccount, TAccountOverride, DelegatedCall[]> & {
  accountMetadata?: { factory: Hex; factoryData: Hex }[];
  calls: DelegatedCall[];
  publicClient: PublicClient<Transport, Chain>;
};

/**
 * Broadcasts a User Operation with delegation to the Bundler.
 *
 * @param client - Client to use for sending the user operation.
 * @param parameters - Parameters for the user operation with delegation.
 * @returns The User Operation hash of the broadcasted operation.
 * @example
 * import { createBundlerClient, http } from 'viem'
 * import { mainnet } from 'viem/chains'
 *
 * const bundlerClient = createBundlerClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 *
 * const userOpHash = await sendUserOperationWithDelegationAction(bundlerClient, {
 *   account: bobSmartAccount,
 *   calls: [
 *     {
 *       to: aliceCounterContractAddress,
 *       data: encodeFunctionData({
 *         abi: CounterMetadata.abi,
 *         functionName: 'increment',
 *       }),
 *       value: 0n,
 *       permissionsContext: '0x...',
 *       delegationManager: '0x...',
 *     },
 *   ],
 *   accountMetadata: [{ factory: '0x...', factoryData: '0x...' }], // Optional: for deploying accounts
 * })
 */
export async function sendUserOperationWithDelegationAction<
  TAccount extends SmartAccount | undefined,
  TAccountOverride extends SmartAccount | undefined = undefined,
>(
  client: BundlerClient<Transport, Chain | undefined, TAccount>,
  parameters: SendUserOperationWithDelegationParameters<
    TAccount,
    TAccountOverride
  >,
) {
  if (parameters.accountMetadata) {
    const { publicClient } = parameters;

    const includedAccountKeys: Record<Hex, boolean> = {};

    const chainId = publicClient.chain?.id;

    if (!chainId) {
      throw new Error('Chain ID is not set');
    }

    const { SimpleFactory } = getSmartAccountsEnvironment(chainId);

    const uniqueAccountMetadatas = parameters.accountMetadata.filter(
      (accountMetadata) => {
        if (!isAddressEqual(accountMetadata.factory, SimpleFactory)) {
          throw new Error(
            `Invalid accountMetadata: ${accountMetadata.factory} is not allowed.`,
          );
        }

        // ensure that factory calls are not duplicated
        const accountKey = concat([
          accountMetadata.factory,
          accountMetadata.factoryData,
        ]);
        const isDuplicate = includedAccountKeys[accountKey];

        includedAccountKeys[accountKey] = true;
        return !isDuplicate;
      },
    );

    const factoryCalls = (
      await Promise.all(
        uniqueAccountMetadatas.map(async ({ factory, factoryData }) => {
          const isDeployed = await publicClient
            .call({
              to: factory,
              data: factoryData,
            })
            .then(() => false)
            .catch(() => true);

          if (isDeployed) {
            return undefined;
          }
          return {
            to: factory,
            value: 0n,
            data: factoryData,
          };
        }),
      )
    ).filter((call: Call | undefined) => call !== undefined) as Call[];

    parameters.calls = [
      ...(factoryCalls as DelegatedCall[]),
      ...parameters.calls,
    ];
  }

  return client.sendUserOperation(
    parameters as unknown as SendUserOperationParameters,
  );
}
