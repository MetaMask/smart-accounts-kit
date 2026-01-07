import {
  EntryPoint,
  SimpleFactory,
  DelegationManager,
  MultiSigDeleGator,
  HybridDeleGator,
  EIP7702StatelessDeleGator,
  SCL_RIP7212,
  AllowedTargetsEnforcer,
  AllowedMethodsEnforcer,
  DeployedEnforcer,
  TimestampEnforcer,
  NonceEnforcer,
  AllowedCalldataEnforcer,
  BlockNumberEnforcer,
  LimitedCallsEnforcer,
  ERC20BalanceChangeEnforcer,
  ERC20StreamingEnforcer,
  IdEnforcer,
  ERC20TransferAmountEnforcer,
  ValueLteEnforcer,
  NativeTokenTransferAmountEnforcer,
  NativeBalanceChangeEnforcer,
  NativeTokenStreamingEnforcer,
  NativeTokenPaymentEnforcer,
  RedeemerEnforcer,
  ArgsEqualityCheckEnforcer,
  ERC721BalanceChangeEnforcer,
  ERC721TransferEnforcer,
  ERC1155BalanceChangeEnforcer,
  OwnershipTransferEnforcer,
  SpecificActionERC20TransferBatchEnforcer,
  ERC20PeriodTransferEnforcer,
  NativeTokenPeriodTransferEnforcer,
  ExactCalldataBatchEnforcer,
  ExactCalldataEnforcer,
  ExactExecutionEnforcer,
  ExactExecutionBatchEnforcer,
  MultiTokenPeriodEnforcer,
} from '@metamask/delegation-abis';
import { DELEGATOR_CONTRACTS } from '@metamask/delegation-deployments';
import type { Chain, Hex, PublicClient, WalletClient } from 'viem';

import type { ContractMetaData, SmartAccountsEnvironment } from './types';
import { deployContract } from './write';

type SupportedVersion = '1.0.0' | '1.1.0' | '1.2.0' | '1.3.0';
export const PREFERRED_VERSION: SupportedVersion = '1.3.0';

const contractOverrideMap: Map<string, SmartAccountsEnvironment> = new Map();

const getContractOverrideKey = (chainId: number, version: SupportedVersion) =>
  `${version}:${chainId}`;

/**
 * Overrides the default environment for a specific chain and version.
 *
 * @param chainId - The chain ID to override.
 * @param version - The version of the environment to override.
 * @param environment - The environment to use as override.
 */
export function overrideDeployedEnvironment(
  chainId: number,
  version: SupportedVersion,
  environment: SmartAccountsEnvironment,
) {
  contractOverrideMap.set(
    getContractOverrideKey(chainId, version),
    environment,
  );
}

/**
 * Gets the SmartAccountsEnvironment for the specified chain and version.
 *
 * @param chainId - The chain ID to get the environment for.
 * @param version - The version of the environment to get.
 * @returns The SmartAccountsEnvironment.
 */
export function getSmartAccountsEnvironment(
  chainId: number,
  version: SupportedVersion = PREFERRED_VERSION,
): SmartAccountsEnvironment {
  const overrideKey = getContractOverrideKey(chainId, version);

  const overriddenContracts = contractOverrideMap.get(overrideKey);
  if (overriddenContracts) {
    return overriddenContracts;
  }

  const contracts = DELEGATOR_CONTRACTS[version]?.[chainId];
  if (!contracts) {
    throw new Error(
      `No contracts found for version ${version} chain ${chainId}`,
    );
  }
  return getSmartAccountsEnvironmentV1(contracts);
}

/**
 * Creates a SmartAccountsEnvironment from contract addresses.
 *
 * @param contracts - The contract addresses to create the environment from.
 * @returns The created SmartAccountsEnvironment.
 */
export function getSmartAccountsEnvironmentV1(contracts: {
  [contract: string]: Hex;
}) {
  return {
    DelegationManager: contracts.DelegationManager,
    EntryPoint: contracts.EntryPoint,
    SimpleFactory: contracts.SimpleFactory,
    implementations: {
      MultiSigDeleGatorImpl: contracts.MultiSigDeleGatorImpl,
      HybridDeleGatorImpl: contracts.HybridDeleGatorImpl,
      EIP7702StatelessDeleGatorImpl: contracts.EIP7702StatelessDeleGatorImpl,
    },
    caveatEnforcers: {
      AllowedCalldataEnforcer: contracts.AllowedCalldataEnforcer,
      AllowedMethodsEnforcer: contracts.AllowedMethodsEnforcer,
      AllowedTargetsEnforcer: contracts.AllowedTargetsEnforcer,
      ArgsEqualityCheckEnforcer: contracts.ArgsEqualityCheckEnforcer,
      BlockNumberEnforcer: contracts.BlockNumberEnforcer,
      DeployedEnforcer: contracts.DeployedEnforcer,
      ERC20BalanceChangeEnforcer: contracts.ERC20BalanceChangeEnforcer,
      ERC20TransferAmountEnforcer: contracts.ERC20TransferAmountEnforcer,
      ERC20StreamingEnforcer: contracts.ERC20StreamingEnforcer,
      ERC721BalanceChangeEnforcer: contracts.ERC721BalanceChangeEnforcer,
      ERC721TransferEnforcer: contracts.ERC721TransferEnforcer,
      ERC1155BalanceChangeEnforcer: contracts.ERC1155BalanceChangeEnforcer,
      IdEnforcer: contracts.IdEnforcer,
      LimitedCallsEnforcer: contracts.LimitedCallsEnforcer,
      NonceEnforcer: contracts.NonceEnforcer,
      TimestampEnforcer: contracts.TimestampEnforcer,
      ValueLteEnforcer: contracts.ValueLteEnforcer,
      NativeTokenTransferAmountEnforcer:
        contracts.NativeTokenTransferAmountEnforcer,
      NativeBalanceChangeEnforcer: contracts.NativeBalanceChangeEnforcer,
      NativeTokenStreamingEnforcer: contracts.NativeTokenStreamingEnforcer,
      NativeTokenPaymentEnforcer: contracts.NativeTokenPaymentEnforcer,
      OwnershipTransferEnforcer: contracts.OwnershipTransferEnforcer,
      RedeemerEnforcer: contracts.RedeemerEnforcer,
      SpecificActionERC20TransferBatchEnforcer:
        contracts.SpecificActionERC20TransferBatchEnforcer,
      ERC20PeriodTransferEnforcer: contracts.ERC20PeriodTransferEnforcer,
      NativeTokenPeriodTransferEnforcer:
        contracts.NativeTokenPeriodTransferEnforcer,
      ExactCalldataBatchEnforcer: contracts.ExactCalldataBatchEnforcer,
      ExactCalldataEnforcer: contracts.ExactCalldataEnforcer,
      ExactExecutionEnforcer: contracts.ExactExecutionEnforcer,
      ExactExecutionBatchEnforcer: contracts.ExactExecutionBatchEnforcer,
      MultiTokenPeriodEnforcer: contracts.MultiTokenPeriodEnforcer,
    },
  } as SmartAccountsEnvironment;
}

export type DeployedContract = {
  name: string;
  address: string;
};

/**
 * Deploys the contracts needed for the Delegation Framework and MetaMask SCA to be functional as well as all Caveat Enforcers.
 *
 * @param walletClient - The wallet client to use for deployment.
 * @param publicClient - The public client to use for deployment.
 * @param chain - The chain to deploy to.
 * @param deployedContracts - Optional map of already deployed contracts.
 * @returns A promise that resolves to the SmartAccountsEnvironment.
 */
export async function deploySmartAccountsEnvironment(
  walletClient: WalletClient,
  publicClient: PublicClient,
  chain: Chain,
  deployedContracts: { [contract: string]: Hex } = {},
) {
  const deployContractCurried = async (
    name: string,
    contract: ContractMetaData,
    params: any[] = [],
  ) => {
    const existingAddress = deployedContracts[name];
    if (existingAddress) {
      return {
        address: existingAddress,
        name,
      };
    }

    const deployedContract = await deployContract(
      walletClient,
      publicClient,
      chain,
      contract,
      params,
    );

    const newDeployedContracts = { ...deployedContracts };
    newDeployedContracts[name] = deployedContract.address;
    Object.assign(deployedContracts, newDeployedContracts);

    return { ...deployedContract, name };
  };

  // Deploy v1.3.0 DeleGator contracts
  // - deploy standalone contracts
  const standaloneContracts = {
    SimpleFactory,
    AllowedCalldataEnforcer,
    AllowedTargetsEnforcer,
    AllowedMethodsEnforcer,
    ArgsEqualityCheckEnforcer,
    DeployedEnforcer,
    TimestampEnforcer,
    BlockNumberEnforcer,
    LimitedCallsEnforcer,
    ERC20BalanceChangeEnforcer,
    ERC20TransferAmountEnforcer,
    ERC20StreamingEnforcer,
    ERC721BalanceChangeEnforcer,
    ERC721TransferEnforcer,
    ERC1155BalanceChangeEnforcer,
    IdEnforcer,
    NonceEnforcer,
    ValueLteEnforcer,
    NativeTokenTransferAmountEnforcer,
    NativeBalanceChangeEnforcer,
    NativeTokenStreamingEnforcer,
    OwnershipTransferEnforcer,
    RedeemerEnforcer,
    SpecificActionERC20TransferBatchEnforcer,
    ERC20PeriodTransferEnforcer,
    NativeTokenPeriodTransferEnforcer,
    ExactCalldataBatchEnforcer,
    ExactCalldataEnforcer,
    ExactExecutionEnforcer,
    ExactExecutionBatchEnforcer,
    MultiTokenPeriodEnforcer,
  };
  for (const [name, contract] of Object.entries(standaloneContracts)) {
    await deployContractCurried(name, contract);
  }

  // - deploy dependencies
  const delegationManager = await deployContractCurried(
    'DelegationManager',
    DelegationManager,
    [walletClient.account?.address],
  );

  // - NativeTokenPaymentEnforcer DelegationManager and ArgsEqualityCheckEnforcer as constructor args
  await deployContractCurried(
    'NativeTokenPaymentEnforcer',
    NativeTokenPaymentEnforcer,
    [delegationManager.address, deployedContracts.ArgsEqualityCheckEnforcer],
  );

  const entryPoint = await deployContractCurried('EntryPoint', EntryPoint);

  // This is a hack to work around the SCL_RIP7212 being deployed as a library.
  // Forge handles this gracefully, but in the tests we need to manually link
  // the library.
  // We don't use the curried function here because we don't need it added to
  // the environment.
  const { address: sclRIP7212 } = await deployContract(
    walletClient,
    publicClient,
    chain,
    SCL_RIP7212,
    [],
  );

  // replace linked library address in bytecode https://docs.soliditylang.org/en/latest/using-the-compiler.html#library-linking
  const hybridDeleGatorWithLinkedLibrary = {
    ...HybridDeleGator,
    bytecode: HybridDeleGator.bytecode.replace(
      /__\$b8f96b288d4d0429e38b8ed50fd423070f\$__/gu,
      sclRIP7212.slice(2),
    ) as Hex,
  };

  // - deploy DeleGator implementations
  await deployContractCurried(
    'HybridDeleGatorImpl',
    hybridDeleGatorWithLinkedLibrary,
    [delegationManager.address, entryPoint.address],
  );

  await deployContractCurried('MultiSigDeleGatorImpl', MultiSigDeleGator, [
    delegationManager.address,
    entryPoint.address,
  ]);

  await deployContractCurried(
    'EIP7702StatelessDeleGatorImpl',
    EIP7702StatelessDeleGator,
    [delegationManager.address, entryPoint.address],
  );

  // Format deployments
  return getSmartAccountsEnvironmentV1(deployedContracts);
}
