import type {
  Account,
  Address,
  Chain,
  Client,
  Hex,
  Transport,
  WalletClient,
} from 'viem';
import { BaseError } from 'viem';
import { parseAccount } from 'viem/accounts';

import { prepareSignUserOperationTypedData } from '../userOp';
import type { UserOperationV07 } from '../userOp';

export type SignUserOperationParameters = {
  /** Account to sign with */
  account?: Account | Address;
  /** The user operation to sign */
  userOperation: Omit<UserOperationV07, 'signature'>;
  /** The entry point contract address */
  entryPoint: { address: Address };
  /** The chain ID that the entry point is deployed on */
  chainId: number;
  /** The address of the smart account */
  address: Address;
  /** The name of the domain of the implementation contract */
  name: 'HybridDeleGator' | 'MultiSigDeleGator';
  /** The version of the domain of the implementation contract */
  version?: string;
};

export type SignUserOperationReturnType = Hex;

/**
 * Signs a user operation using a wallet client.
 *
 * @param client - The wallet client to use for signing.
 * @param parameters - The parameters for signing the user operation.
 * @returns The signature of the user operation.
 * @example
 * ```ts
 * const signature = await signUserOperation(walletClient, {
 *   userOperation: {
 *     sender: '0x...',
 *     nonce: 0n,
 *     callData: '0x',
 *     callGasLimit: 1000000n,
 *     verificationGasLimit: 1000000n,
 *     preVerificationGas: 21000n,
 *     maxFeePerGas: 1000000000n,
 *     maxPriorityFeePerGas: 1000000000n
 *   },
 *   entryPoint: { address: '0x...' },
 *   chainId: 1,
 *   address: '0x...',
 *   name: 'HybridDeleGator'
 * });
 * ```
 */
export async function signUserOperation<
  TChain extends Chain | undefined,
  TAccount extends Account | undefined,
>(
  client: Client<Transport, TChain, TAccount> & {
    signTypedData: WalletClient['signTypedData'];
  },
  parameters: SignUserOperationParameters,
): Promise<SignUserOperationReturnType> {
  const {
    account: accountParam = client.account,
    userOperation,
    entryPoint,
    chainId,
    name,
    address,
    version = '1',
  } = parameters;

  if (!accountParam) {
    throw new BaseError('Account not found. Please provide an account.');
  }

  const account = parseAccount(accountParam);

  const typedData = prepareSignUserOperationTypedData({
    userOperation,
    entryPoint,
    chainId,
    name,
    address,
    version,
  });

  return client.signTypedData({
    account,
    ...typedData,
  });
}

/**
 * Creates a sign user operation action that can be used to extend a wallet client.
 *
 * @returns A function that can be used with wallet client extend method.
 * @example
 * ```ts
 * const walletClient = createWalletClient({
 *   chain: mainnet,
 *   transport: http()
 * }).extend(signUserOperationActions());
 * ```
 */
export function signUserOperationActions() {
  return <
    TChain extends Chain | undefined,
    TAccount extends Account | undefined,
  >(
    client: Client<Transport, TChain, TAccount> & {
      signTypedData: WalletClient['signTypedData'];
    },
  ) => ({
    signUserOperation: async (
      parameters: Omit<SignUserOperationParameters, 'chainId'> & {
        chainId?: number;
      },
    ) =>
      signUserOperation(client, {
        chainId:
          parameters.chainId ??
          (() => {
            if (!client.chain?.id) {
              throw new BaseError(
                'Chain ID is required. Either provide it in parameters or configure the client with a chain.',
              );
            }
            return client.chain.id;
          })(),
        ...parameters,
      }),
  });
}
