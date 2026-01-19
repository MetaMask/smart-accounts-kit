import type {
  HybridDeleGator,
  MultiSigDeleGator,
  EIP7702StatelessDeleGator,
} from '@metamask/delegation-abis';
import type {
  Abi,
  Account,
  Address,
  Chain,
  Hex,
  OneOf,
  PublicClient,
  Transport,
  WalletClient,
} from 'viem';
import type {
  entryPoint07Abi,
  SmartAccount,
  SmartAccountImplementation,
  WebAuthnAccount,
} from 'viem/account-abstraction';
import type { Prettify } from 'viem/chains';

import type { Implementation } from './constants';
import type { ExecutionMode, ExecutionStruct } from './executions';

/**
 * Represents a caveat that restricts or conditions a delegation.
 *
 * enforcer - The address of the contract that enforces this caveat's conditions.
 *
 * terms - The terms or conditions of the caveat encoded as hex data.
 *
 * args - Additional arguments required by the caveat enforcer, encoded as hex data.
 */
export type Caveat = {
  enforcer: Hex;
  terms: Hex;
  args: Hex;
};

/**
 * Represents a delegation that grants permissions from a delegator to a delegate.
 *
 * delegate - The address of the entity receiving the delegation.
 *
 * delegator - The address of the entity granting the delegation.
 *
 * authority - The authority under which this delegation is granted. For root delegations, this is ROOT_AUTHORITY.
 *
 * caveats - An array of restrictions or conditions applied to this delegation.
 *
 * salt - A unique value to prevent replay attacks and ensure uniqueness of the delegation.
 *
 * signature - The cryptographic signature validating this delegation.
 */
export type Delegation = {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: Caveat[];
  salt: Hex;
  signature: Hex;
};

/**
 * A version agnostic blob of contract addresses required for the DeleGator system to function.
 */
export type SmartAccountsEnvironment = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DelegationManager: Hex;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EntryPoint: Hex;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SimpleFactory: Hex;
  implementations: {
    [implementation: string]: Hex;
  };
  caveatEnforcers: {
    [enforcer: string]: Hex;
  };
};

/**
 * Contract configuration for initializing a MultiSigDeleGator.
 */
export type MultiSigDeleGatorDeployParams = [signers: Hex[], threshold: bigint];

/**
 * Contract configuration for initializing a HybridDeleGator.
 */
export type HybridDeleGatorDeployParams = [
  owner: Hex,
  keyIds: string[],
  xValues: bigint[],
  yValues: bigint[],
];

/**
 * Metadata for a contract deployment.
 */
export type ContractMetaData = { bytecode: Hex; abi: Abi };

/**
 * Optional properties for user operations.
 */
export type OptionalUserOpProps = {
  factory?: Hex;
  factoryData?: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  paymaster?: Hex;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
  paymasterData?: Hex;
};

// When passed to on-chain contacts (the EntryPoint contract, and then to account and paymaster), a packed version of the above structure is used:
export type PackedUserOperationStruct = {
  sender: Hex;
  nonce: bigint;
  initCode: Hex; // concatenation of factory address and factoryData (or empty)
  callData: Hex;
  accountGasLimits: Hex; // concatenation of verificationGas (16 bytes) and callGas (16 bytes)
  preVerificationGas: bigint;
  gasFees: Hex; // concatenation of maxPriorityFee (16 bytes) and maxFeePerGas (16 bytes)
  paymasterAndData: Hex; // concatenation of paymaster fields (or empty)
  signature: Hex;
};

/**
 * Redemption data, including delegations, executions, and mode.
 */
export type Redemption = {
  permissionContext: Delegation[];
  executions: ExecutionStruct[];
  mode: ExecutionMode;
};

export type DeployParams<TImplementation extends Implementation> = {
  [Implementation.MultiSig]: MultiSigDeleGatorDeployParams;
  [Implementation.Hybrid]: HybridDeleGatorDeployParams;
  [Implementation.Stateless7702]: never; // Stateless7702 doesn't support deploy params
}[TImplementation];

export type ToMetaMaskSmartAccountParameters<
  TImplementation extends Implementation,
> = {
  client: PublicClient;
  implementation: TImplementation;
  signer: SignerConfigByImplementation<TImplementation>;
  environment?: SmartAccountsEnvironment;
} & OneOf<
  | {
      deployParams: DeployParams<TImplementation>;
      deploySalt: Hex;
    }
  | {
      address: Address;
    }
>;

export type SignUserOperationParams = Parameters<
  ToMetaMaskSmartAccountReturnType<Implementation>['signUserOperation']
>[0];

export type SignDelegationParams = {
  delegation: Omit<Delegation, 'signature'>;
} & { chainId?: number };

export type MetaMaskSmartAccountImplementation<
  TImplementation extends Implementation,
> = SmartAccountImplementation<
  typeof entryPoint07Abi,
  '0.7',
  {
    abi: {
      [Implementation.Hybrid]: typeof HybridDeleGator;
      [Implementation.MultiSig]: typeof MultiSigDeleGator;
      [Implementation.Stateless7702]: typeof EIP7702StatelessDeleGator;
    }[TImplementation];
    signDelegation: (params: SignDelegationParams) => Promise<Hex>;
    environment: SmartAccountsEnvironment;
  }
>;

export type MetaMaskSmartAccount<
  TImplementation extends Implementation = Implementation,
> = ToMetaMaskSmartAccountReturnType<TImplementation>;

export type ToMetaMaskSmartAccountReturnType<
  TImplementation extends Implementation,
> = Prettify<SmartAccount<MetaMaskSmartAccountImplementation<TImplementation>>>;

// Specific signer type that is derived from the external SignerConfig
export type InternalSigner = Pick<
  SmartAccountImplementation,
  'signMessage' | 'signTypedData' | 'getStubSignature'
>;

export type WalletSignerConfig = {
  walletClient: WalletClient<Transport, Chain | undefined, Account>;
};

export type AccountSignerConfig = {
  account: Pick<Account, 'signMessage' | 'signTypedData' | 'address'>;
};

export type WebAuthnSignerConfig = {
  webAuthnAccount: WebAuthnAccount;
  keyId: Hex;
};

export type HybridSignerConfig =
  | WalletSignerConfig
  | AccountSignerConfig
  | WebAuthnSignerConfig;

export type MultiSigSignerConfig = (WalletSignerConfig | AccountSignerConfig)[];

export type Stateless7702SignerConfig =
  | WalletSignerConfig
  | AccountSignerConfig;

export type SignerConfigByImplementation<
  TImplementation extends Implementation,
> = {
  [Implementation.Hybrid]: HybridSignerConfig;
  [Implementation.MultiSig]: MultiSigSignerConfig;
  [Implementation.Stateless7702]: Stateless7702SignerConfig;
}[TImplementation];

// this type shadows `Call` from viem, which isn't exported
export type Call = {
  to: Hex;
  data?: Hex | undefined;
  value?: bigint | undefined;
};

export type AbiByImplementation = {
  [Implementation.Hybrid]: typeof HybridDeleGator;
  [Implementation.MultiSig]: typeof MultiSigDeleGator;
  [Implementation.Stateless7702]: typeof EIP7702StatelessDeleGator;
};
