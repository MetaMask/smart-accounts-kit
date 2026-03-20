import type { Transport, Chain, Hex, Client, Account } from 'viem';
import {
  createBundlerClient,
  type BundlerClient,
  type BundlerClientConfig,
  type SmartAccount,
} from 'viem/account-abstraction';

import { trackSmartAccountsKitFunctionCall } from '../analytics';

/**
 * Gas price tiers returned by pimlico_getUserOperationGasPrice
 */
export type GasPriceTier = {
  /** Maximum fee per gas in hex format */
  maxFeePerGas: Hex;
  /** Maximum priority fee per gas in hex format */
  maxPriorityFeePerGas: Hex;
};

/**
 * Response from pimlico_getUserOperationGasPrice RPC method
 */
export type UserOperationGasPriceResponse = {
  /** Slow gas price tier */
  slow: GasPriceTier;
  /** Standard gas price tier */
  standard: GasPriceTier;
  /** Fast gas price tier */
  fast: GasPriceTier;
};

/**
 * Pimlico bundler schema for type-safe RPC method calls
 */
/* eslint-disable @typescript-eslint/naming-convention */
type PimlicoBundlerSchema = [
  {
    Method: 'pimlico_getUserOperationGasPrice';
    Parameters: [];
    ReturnType: UserOperationGasPriceResponse;
  },
];

/**
 * Infura bundler actions for extending bundler clients.
 *
 * @returns A function that takes a client and returns the client extension with Infura bundler actions.
 */
const infuraBundlerActions = () => (client: Client) => ({
  /**
   * Get user operation gas prices from Infura bundler.
   * Calls the pimlico_getUserOperationGasPrice RPC method.
   *
   * @returns Promise resolving to gas price tiers (slow, standard, fast).
   * @example
   * ```typescript
   * const gasPrices = await bundlerClient.getUserOperationGasPrice();
   * console.log(gasPrices.standard.maxFeePerGas);
   * ```
   */
  async getUserOperationGasPrice(): Promise<UserOperationGasPriceResponse> {
    const pimlicoClient = client as Client<
      Transport,
      Chain | undefined,
      Account | undefined,
      PimlicoBundlerSchema
    >;

    return await pimlicoClient.request({
      method: 'pimlico_getUserOperationGasPrice',
      params: [],
    });
  },
});

/**
 * Type for bundler client extended with Infura bundler actions.
 */
export type InfuraBundlerClient<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends SmartAccount | undefined = SmartAccount | undefined,
> = BundlerClient<TTransport, TChain, TAccount> & {
  /**
   * Get user operation gas prices from Infura bundler.
   * Calls the pimlico_getUserOperationGasPrice RPC method.
   *
   * @returns Promise resolving to gas price tiers (slow, standard, fast).
   */
  getUserOperationGasPrice(): Promise<UserOperationGasPriceResponse>;
};

/**
 * Creates an Infura bundler client extended with Infura bundler actions.
 *
 * This is a wrapper around viem's createBundlerClient that extends it with
 * the getUserOperationGasPrice method for retrieving gas prices from Pimlico's
 * bundler infrastructure via Infura's proxy.
 *
 * @param config - Configuration for the bundler client.
 * @returns Extended bundler client with Infura bundler actions.
 * @example
 * ```typescript
 * import { createPublicClient, http } from 'viem';
 * import { sepolia } from 'viem/chains';
 * import { createInfuraBundlerClient } from '@metamask/smart-accounts-kit';
 *
 * const publicClient = createPublicClient({
 *   chain: sepolia,
 *   transport: http('https://sepolia.infura.io/v3/YOUR_API_KEY'),
 * });
 *
 * const bundlerClient = createInfuraBundlerClient({
 *   client: publicClient,
 *   transport: http('https://sepolia.infura.io/v3/YOUR_API_KEY'),
 *   chain: sepolia,
 * });
 *
 * // Use standard bundler methods
 * const userOpHash = await bundlerClient.sendUserOperation({...});
 *
 * // Use Infura specific methods
 * const gasPrices = await bundlerClient.getUserOperationGasPrice();
 * ```
 */
export function createInfuraBundlerClient<
  TTransport extends Transport,
  TChain extends Chain | undefined = undefined,
  TAccount extends SmartAccount | undefined = undefined,
>(
  config: BundlerClientConfig<TTransport, TChain, TAccount>,
): InfuraBundlerClient<TTransport, TChain, TAccount> {
  trackSmartAccountsKitFunctionCall('createInfuraBundlerClient', {
    chainId: config.chain?.id ?? null,
  });
  // Create the base bundler client using viem's function
  const baseBundlerClient = createBundlerClient(config);

  // Extend the client with Infura bundler actions
  return baseBundlerClient.extend(
    infuraBundlerActions(),
  ) as unknown as InfuraBundlerClient<TTransport, TChain, TAccount>;
}
