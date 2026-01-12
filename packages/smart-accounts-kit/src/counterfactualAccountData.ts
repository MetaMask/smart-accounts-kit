import type { Address, Hex } from 'viem';
import { getContractAddress, pad } from 'viem';

import { Implementation } from './constants';
import { initializeHybridDeleGator } from './DelegationFramework/HybridDeleGator/encode';
import { initializeMultiSigDeleGator } from './DelegationFramework/MultiSigDeleGator/encode';
import { create2Deploy as encodeCreate2Deploy } from './DelegationFramework/SimpleFactory/encode';
import { encodeProxyCreationCode } from './DelegationFramework/utils';
import type {
  SmartAccountsEnvironment,
  HybridDeleGatorDeployParams,
  MultiSigDeleGatorDeployParams,
  DeployParams,
} from './types';

/**
 * Infers counterfactual account data for a DeleGator smart account.
 *
 * @template TImplementation - The type of implementation, extending Implementation.
 * @template TDeployParams - The type of deployment parameters, defaults to DeployParams<Implementation>.
 * @param options - The options for generating counterfactual account data.
 * @param options.factory - The address of the SimpleFactory contract.
 * @param options.implementations - The DeleGator implementation contracts.
 * @param options.implementation - The implementation type to use.
 * @param options.deployParams - The deployment parameters for the specified implementation.
 * @param options.deploySalt - The salt to use for CREATE2 address computation.
 * @returns An object containing the counterfactual address and factory calldata.
 * @description This function calculates the address a DeleGator contract would have if deployed,
 * and provides the calldata needed to deploy it.
 */
export const getCounterfactualAccountData = async <
  TImplementation extends Implementation,
>({
  factory,
  implementations,
  implementation,
  deployParams,
  deploySalt,
}: {
  factory: Address;
  implementations: SmartAccountsEnvironment['implementations'];
  implementation: TImplementation;
  deployParams: DeployParams<TImplementation>;
  deploySalt: Hex;
}): Promise<{ factoryData: Hex; address: Address }> => {
  let implementationAddress: Address;
  let initcode: Hex;

  switch (implementation) {
    case Implementation.Hybrid: {
      const [owner, keyIds, xValues, yValues] =
        deployParams as HybridDeleGatorDeployParams;

      if (!implementations.HybridDeleGatorImpl) {
        throw new Error(
          'HybridDeleGatorImpl address not provided in environment',
        );
      }

      implementationAddress = implementations.HybridDeleGatorImpl;

      const p256Owners = keyIds.map((keyId, index) => {
        const xValue = xValues[index];
        const yValue = yValues[index];

        if (!xValue || !yValue) {
          throw new Error(
            `Missing X or Y value for keyId ${keyId} at index ${index}`,
          );
        }

        return {
          keyId,
          x: xValue,
          y: yValue,
        };
      });

      initcode = initializeHybridDeleGator({ eoaOwner: owner, p256Owners });
      break;
    }
    case Implementation.MultiSig: {
      const [owners, threshold] = deployParams as MultiSigDeleGatorDeployParams;

      if (!implementations.MultiSigDeleGatorImpl) {
        throw new Error(
          'MultiSigDeleGatorImpl address not provided in environment',
        );
      }

      implementationAddress = implementations.MultiSigDeleGatorImpl;
      initcode = initializeMultiSigDeleGator({ owners, threshold });
      break;
    }
    case Implementation.Stateless7702:
    default:
      throw new Error(`Implementation type '${implementation}' not supported`);
  }

  const salt = pad(deploySalt, { dir: 'left', size: 32 });

  const proxyCreationCode = encodeProxyCreationCode({
    implementationAddress,
    initcode,
  });

  const address = getContractAddress({
    bytecode: proxyCreationCode,
    from: factory,
    opcode: 'CREATE2',
    salt,
  });

  const factoryData = encodeCreate2Deploy(proxyCreationCode, salt);

  return {
    factoryData,
    address,
  };
};
