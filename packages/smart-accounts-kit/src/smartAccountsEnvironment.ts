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
import {
  EntryPoint as EntryPointBytecode,
  SimpleFactory as SimpleFactoryBytecode,
  DelegationManager as DelegationManagerBytecode,
  MultiSigDeleGator as MultiSigDeleGatorBytecode,
  HybridDeleGator as HybridDeleGatorBytecode,
  EIP7702StatelessDeleGator as EIP7702StatelessDeleGatorBytecode,
  SCL_RIP7212 as SCLRIP7212Bytecode,
  AllowedTargetsEnforcer as AllowedTargetsEnforcerBytecode,
  AllowedMethodsEnforcer as AllowedMethodsEnforcerBytecode,
  DeployedEnforcer as DeployedEnforcerBytecode,
  TimestampEnforcer as TimestampEnforcerBytecode,
  NonceEnforcer as NonceEnforcerBytecode,
  AllowedCalldataEnforcer as AllowedCalldataEnforcerBytecode,
  BlockNumberEnforcer as BlockNumberEnforcerBytecode,
  LimitedCallsEnforcer as LimitedCallsEnforcerBytecode,
  ERC20BalanceChangeEnforcer as ERC20BalanceChangeEnforcerBytecode,
  ERC20StreamingEnforcer as ERC20StreamingEnforcerBytecode,
  IdEnforcer as IdEnforcerBytecode,
  ERC20TransferAmountEnforcer as ERC20TransferAmountEnforcerBytecode,
  ValueLteEnforcer as ValueLteEnforcerBytecode,
  NativeTokenTransferAmountEnforcer as NativeTokenTransferAmountEnforcerBytecode,
  NativeBalanceChangeEnforcer as NativeBalanceChangeEnforcerBytecode,
  NativeTokenStreamingEnforcer as NativeTokenStreamingEnforcerBytecode,
  NativeTokenPaymentEnforcer as NativeTokenPaymentEnforcerBytecode,
  RedeemerEnforcer as RedeemerEnforcerBytecode,
  ArgsEqualityCheckEnforcer as ArgsEqualityCheckEnforcerBytecode,
  ERC721BalanceChangeEnforcer as ERC721BalanceChangeEnforcerBytecode,
  ERC721TransferEnforcer as ERC721TransferEnforcerBytecode,
  ERC1155BalanceChangeEnforcer as ERC1155BalanceChangeEnforcerBytecode,
  OwnershipTransferEnforcer as OwnershipTransferEnforcerBytecode,
  SpecificActionERC20TransferBatchEnforcer as SpecificActionERC20TransferBatchEnforcerBytecode,
  ERC20PeriodTransferEnforcer as ERC20PeriodTransferEnforcerBytecode,
  NativeTokenPeriodTransferEnforcer as NativeTokenPeriodTransferEnforcerBytecode,
  ExactCalldataBatchEnforcer as ExactCalldataBatchEnforcerBytecode,
  ExactCalldataEnforcer as ExactCalldataEnforcerBytecode,
  ExactExecutionEnforcer as ExactExecutionEnforcerBytecode,
  ExactExecutionBatchEnforcer as ExactExecutionBatchEnforcerBytecode,
  MultiTokenPeriodEnforcer as MultiTokenPeriodEnforcerBytecode,
} from '@metamask/delegation-abis/bytecode';
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
    SimpleFactory: {
      abi: SimpleFactory,
      bytecode: SimpleFactoryBytecode,
    },
    AllowedCalldataEnforcer: {
      abi: AllowedCalldataEnforcer,
      bytecode: AllowedCalldataEnforcerBytecode,
    },
    AllowedTargetsEnforcer: {
      abi: AllowedTargetsEnforcer,
      bytecode: AllowedTargetsEnforcerBytecode,
    },
    AllowedMethodsEnforcer: {
      abi: AllowedMethodsEnforcer,
      bytecode: AllowedMethodsEnforcerBytecode,
    },
    ArgsEqualityCheckEnforcer: {
      abi: ArgsEqualityCheckEnforcer,
      bytecode: ArgsEqualityCheckEnforcerBytecode,
    },
    DeployedEnforcer: {
      abi: DeployedEnforcer,
      bytecode: DeployedEnforcerBytecode,
    },
    TimestampEnforcer: {
      abi: TimestampEnforcer,
      bytecode: TimestampEnforcerBytecode,
    },
    BlockNumberEnforcer: {
      abi: BlockNumberEnforcer,
      bytecode: BlockNumberEnforcerBytecode,
    },
    LimitedCallsEnforcer: {
      abi: LimitedCallsEnforcer,
      bytecode: LimitedCallsEnforcerBytecode,
    },
    ERC20BalanceChangeEnforcer: {
      abi: ERC20BalanceChangeEnforcer,
      bytecode: ERC20BalanceChangeEnforcerBytecode,
    },
    ERC20TransferAmountEnforcer: {
      abi: ERC20TransferAmountEnforcer,
      bytecode: ERC20TransferAmountEnforcerBytecode,
    },
    ERC20StreamingEnforcer: {
      abi: ERC20StreamingEnforcer,
      bytecode: ERC20StreamingEnforcerBytecode,
    },
    ERC721BalanceChangeEnforcer: {
      abi: ERC721BalanceChangeEnforcer,
      bytecode: ERC721BalanceChangeEnforcerBytecode,
    },
    ERC721TransferEnforcer: {
      abi: ERC721TransferEnforcer,
      bytecode: ERC721TransferEnforcerBytecode,
    },
    ERC1155BalanceChangeEnforcer: {
      abi: ERC1155BalanceChangeEnforcer,
      bytecode: ERC1155BalanceChangeEnforcerBytecode,
    },
    IdEnforcer: { abi: IdEnforcer, bytecode: IdEnforcerBytecode },
    NonceEnforcer: {
      abi: NonceEnforcer,
      bytecode: NonceEnforcerBytecode,
    },
    ValueLteEnforcer: {
      abi: ValueLteEnforcer,
      bytecode: ValueLteEnforcerBytecode,
    },
    NativeTokenTransferAmountEnforcer: {
      abi: NativeTokenTransferAmountEnforcer,
      bytecode: NativeTokenTransferAmountEnforcerBytecode,
    },
    NativeBalanceChangeEnforcer: {
      abi: NativeBalanceChangeEnforcer,
      bytecode: NativeBalanceChangeEnforcerBytecode,
    },
    NativeTokenStreamingEnforcer: {
      abi: NativeTokenStreamingEnforcer,
      bytecode: NativeTokenStreamingEnforcerBytecode,
    },
    OwnershipTransferEnforcer: {
      abi: OwnershipTransferEnforcer,
      bytecode: OwnershipTransferEnforcerBytecode,
    },
    RedeemerEnforcer: {
      abi: RedeemerEnforcer,
      bytecode: RedeemerEnforcerBytecode,
    },
    SpecificActionERC20TransferBatchEnforcer: {
      abi: SpecificActionERC20TransferBatchEnforcer,
      bytecode: SpecificActionERC20TransferBatchEnforcerBytecode,
    },
    ERC20PeriodTransferEnforcer: {
      abi: ERC20PeriodTransferEnforcer,
      bytecode: ERC20PeriodTransferEnforcerBytecode,
    },
    NativeTokenPeriodTransferEnforcer: {
      abi: NativeTokenPeriodTransferEnforcer,
      bytecode: NativeTokenPeriodTransferEnforcerBytecode,
    },
    ExactCalldataBatchEnforcer: {
      abi: ExactCalldataBatchEnforcer,
      bytecode: ExactCalldataBatchEnforcerBytecode,
    },
    ExactCalldataEnforcer: {
      abi: ExactCalldataEnforcer,
      bytecode: ExactCalldataEnforcerBytecode,
    },
    ExactExecutionEnforcer: {
      abi: ExactExecutionEnforcer,
      bytecode: ExactExecutionEnforcerBytecode,
    },
    ExactExecutionBatchEnforcer: {
      abi: ExactExecutionBatchEnforcer,
      bytecode: ExactExecutionBatchEnforcerBytecode,
    },
    MultiTokenPeriodEnforcer: {
      abi: MultiTokenPeriodEnforcer,
      bytecode: MultiTokenPeriodEnforcerBytecode,
    },
  };
  for (const [name, contract] of Object.entries(standaloneContracts)) {
    await deployContractCurried(name, contract);
  }

  // - deploy dependencies
  const delegationManager = await deployContractCurried(
    'DelegationManager',
    { abi: DelegationManager, bytecode: DelegationManagerBytecode },
    [walletClient.account?.address],
  );

  // - NativeTokenPaymentEnforcer DelegationManager and ArgsEqualityCheckEnforcer as constructor args
  await deployContractCurried(
    'NativeTokenPaymentEnforcer',
    {
      abi: NativeTokenPaymentEnforcer,
      bytecode: NativeTokenPaymentEnforcerBytecode,
    },
    [delegationManager.address, deployedContracts.ArgsEqualityCheckEnforcer],
  );

  const entryPoint = await deployContractCurried('EntryPoint', {
    abi: EntryPoint,
    bytecode: EntryPointBytecode,
  });

  // This is a hack to work around the SCL_RIP7212 being deployed as a library.
  // Forge handles this gracefully, but in the tests we need to manually link
  // the library.
  // We don't use the curried function here because we don't need it added to
  // the environment.
  const { address: sclRIP7212 } = await deployContract(
    walletClient,
    publicClient,
    chain,
    { abi: SCL_RIP7212, bytecode: SCLRIP7212Bytecode },
    [],
  );

  // replace linked library address in bytecode https://docs.soliditylang.org/en/latest/using-the-compiler.html#library-linking
  const hybridDeleGatorWithLinkedLibrary = {
    abi: HybridDeleGator,
    bytecode: HybridDeleGatorBytecode.replace(
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

  await deployContractCurried(
    'MultiSigDeleGatorImpl',
    {
      abi: MultiSigDeleGator,
      bytecode: MultiSigDeleGatorBytecode,
    },
    [delegationManager.address, entryPoint.address],
  );

  await deployContractCurried(
    'EIP7702StatelessDeleGatorImpl',
    {
      abi: EIP7702StatelessDeleGator,
      bytecode: EIP7702StatelessDeleGatorBytecode,
    },
    [delegationManager.address, entryPoint.address],
  );

  // Format deployments
  return getSmartAccountsEnvironmentV1(deployedContracts);
}
