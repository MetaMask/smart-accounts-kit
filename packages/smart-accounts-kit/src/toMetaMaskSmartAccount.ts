import {
  EIP7702StatelessDeleGator,
  HybridDeleGator,
  MultiSigDeleGator,
} from '@metamask/delegation-abis';
import { type Address, type Hex } from 'viem';
import {
  entryPoint07Abi,
  toPackedUserOperation,
  toSmartAccount,
} from 'viem/account-abstraction';

import { isValid7702Implementation } from './actions/isValid7702Implementation';
import { trackSmartAccountsKitFunctionCall } from './analytics';
import { Implementation } from './constants';
import { getCounterfactualAccountData } from './counterfactualAccountData';
import {
  SIGNABLE_DELEGATION_TYPED_DATA,
  toDelegationStruct,
} from './delegation';
import { encodeCallsForCaller } from './encodeCalls';
import { resolveSigner } from './signer';
import { getSmartAccountsEnvironment } from './smartAccountsEnvironment';
import type {
  Call,
  ToMetaMaskSmartAccountParameters,
  ToMetaMaskSmartAccountReturnType,
  SignDelegationParams,
  SignUserOperationParams,
  AbiByImplementation,
} from './types';
import { SIGNABLE_USER_OP_TYPED_DATA } from './userOp';

const ENTRYPOINT_VERSION = '0.7' as const;

/**
 * Creates a MetaMask DeleGator smart account instance.
 *
 * @template TImplementation - The type of implementation, extending Implementation.
 * @param params - The parameters for creating the smart account.
 * @returns A promise that resolves to a MetaMaskSmartAccount instance.
 * @description
 * This function sets up a MetaMask DeleGator smart account with the specified implementation.
 * It handles both deployed accounts, and counterfactual accounts.
 * A caller may specify a SmartAccountsEnvironment, otherwise the environment will be inferred from the chain.
 */
export async function toMetaMaskSmartAccount<
  TImplementation extends Implementation,
>(
  params: ToMetaMaskSmartAccountParameters<TImplementation>,
): Promise<ToMetaMaskSmartAccountReturnType<TImplementation>> {
  const {
    client,
    client: { chain },
    implementation,
    nonceKeyManager,
  } = params;

  trackSmartAccountsKitFunctionCall('toMetaMaskSmartAccount', {
    implementation,
    hasAddress: params.address !== undefined,
    hasEnvironment: params.environment !== undefined,
    chainId: chain?.id ?? null,
  });

  if (!chain) {
    throw new Error('Chain not specified');
  }

  const signer = resolveSigner({
    implementation,
    signer: params.signer,
  });

  const environment =
    params.environment ?? getSmartAccountsEnvironment(chain.id);

  let address: Address, factoryData: Hex | undefined;

  if (params.address) {
    factoryData = undefined;
    address = params.address;
  } else {
    if (implementation === Implementation.Stateless7702) {
      throw new Error('Stateless7702 does not support counterfactual accounts');
    }

    const accountData = await getCounterfactualAccountData({
      factory: environment.SimpleFactory,
      implementations: environment.implementations,
      implementation,
      deployParams: params.deployParams,
      deploySalt: params.deploySalt,
    });

    address = accountData.address;
    factoryData = accountData.factoryData;
  }

  const entryPoint = {
    abi: entryPoint07Abi,
    address: environment.EntryPoint,
    version: ENTRYPOINT_VERSION,
  } as const;

  const { abi, contractName } = {
    [Implementation.Hybrid]: {
      contractName: 'HybridDeleGator',
      abi: HybridDeleGator,
    },
    [Implementation.MultiSig]: {
      contractName: 'MultiSigDeleGator',
      abi: MultiSigDeleGator,
    },
    [Implementation.Stateless7702]: {
      contractName: 'EIP7702StatelessDeleGator',
      abi: EIP7702StatelessDeleGator,
    },
  }[implementation] as {
    contractName: string;
    abi: AbiByImplementation[TImplementation];
  };

  const getFactoryArgs = async () => {
    if (factoryData === undefined) {
      throw new Error(
        'Deploy params were not provided, so factory args cannot be inferred',
      );
    }
    return {
      factoryData,
      factory: environment.SimpleFactory,
    };
  };

  const signDelegation = async (delegationParams: SignDelegationParams) => {
    if (!signer) {
      throw new Error(
        'Cannot sign delegation: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    }

    const { delegation, chainId } = delegationParams;

    const delegationStruct = toDelegationStruct({
      ...delegation,
      signature: '0x',
    });

    const signature = await signer.signTypedData({
      domain: {
        chainId: chainId ?? chain.id,
        name: 'DelegationManager',
        version: '1',
        verifyingContract: environment.DelegationManager,
      },
      types: SIGNABLE_DELEGATION_TYPED_DATA,
      primaryType: 'Delegation',
      message: delegationStruct,
    });

    return signature;
  };

  const signUserOperation = async (userOpParams: SignUserOperationParams) => {
    if (!signer) {
      throw new Error(
        'Cannot sign user operation: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    }

    const { chainId } = userOpParams;

    const packedUserOp = toPackedUserOperation({
      sender: address,
      ...userOpParams,
      signature: '0x',
    });

    const signature = await signer.signTypedData({
      domain: {
        chainId: chainId ?? chain.id,
        name: contractName,
        version: '1',
        verifyingContract: address,
      },
      types: SIGNABLE_USER_OP_TYPED_DATA,
      primaryType: 'PackedUserOperation',
      message: { ...packedUserOp, entryPoint: entryPoint.address },
    });

    return signature;
  };

  const getAddress = async () => address;

  const encodeCalls = async (calls: readonly Call[]) =>
    encodeCallsForCaller(address, calls);

  const signerMethods = signer ?? {
    signMessage: async () => {
      throw new Error(
        'Cannot sign message: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    },
    signTypedData: async () => {
      throw new Error(
        'Cannot sign typed data: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    },
    getStubSignature: async () => {
      throw new Error(
        'Cannot get stub signature: signer not provided. Specify a signer in toMetaMaskSmartAccount() to perform signing operations.',
      );
    },
  };

  const smartAccount = await toSmartAccount({
    abi,
    client,
    entryPoint,
    environment,
    getAddress,
    getFactoryArgs,
    encodeCalls,
    signUserOperation,
    signDelegation,
    nonceKeyManager,
    ...signerMethods,
  });

  // Override isDeployed only for EIP-7702 implementation to check proper delegation code
  if (implementation === Implementation.Stateless7702) {
    return {
      ...smartAccount,
      isDeployed: async () =>
        isValid7702Implementation({
          client,
          accountAddress: address,
          environment,
        }),
    };
  }

  // For other implementations, use the default isDeployed behavior
  return smartAccount;
}
