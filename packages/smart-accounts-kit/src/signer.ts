import { concat } from 'viem';
import type {
  Address,
  SignableMessage,
  TypedData,
  TypedDataDefinition,
} from 'viem';
import type { WebAuthnAccount } from 'viem/account-abstraction';

import { Implementation } from './constants';
import { aggregateSignature } from './signatures';
import type {
  AccountSignerConfig,
  HybridSignerConfig,
  InternalSigner,
  MultiSigSignerConfig,
  SignerConfigByImplementation,
  Stateless7702SignerConfig,
  WalletSignerConfig,
} from './types';
import {
  createDummyWebAuthnSignature,
  encodeDeleGatorSignature,
} from './webAuthn';

// A valid ECDSA signature, this must be able to ecrecover an address, otherwise the contracts will revert in isValidSignature
const EOA_STUB_SIGNATURE =
  '0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000011b' as const;

const resolveSignerFromWalletConfig = (
  config: WalletSignerConfig,
): InternalSigner => {
  return {
    signMessage: config.walletClient.signMessage,
    signTypedData: async (typedData) => {
      // todo: figure out this type so that we don't need the type assertion
      return config.walletClient.signTypedData(typedData as any);
    },
    getStubSignature: async () => EOA_STUB_SIGNATURE,
  };
};

const resolveSignerFromAccountConfig = (config: AccountSignerConfig) => {
  return {
    signMessage: config.account.signMessage,
    signTypedData: config.account.signTypedData,
    getStubSignature: async () => EOA_STUB_SIGNATURE,
  };
};

const resolveHybridSigner = (config: HybridSignerConfig): InternalSigner => {
  if ('walletClient' in config) {
    return resolveSignerFromWalletConfig(config);
  } else if ('account' in config) {
    const { signMessage, signTypedData, getStubSignature } =
      resolveSignerFromAccountConfig(config);
    if (!signMessage) {
      throw new Error('Account does not support signMessage');
    }
    if (!signTypedData) {
      throw new Error('Account does not support signTypedData');
    }
    return {
      signMessage,
      signTypedData,
      getStubSignature,
    };
  }
  const { keyId, webAuthnAccount } = config;

  if (webAuthnAccount.type !== 'webAuthn') {
    throw new Error('Account is not a webAuthn account');
  }

  const encodeSignature = (
    result: Awaited<ReturnType<WebAuthnAccount['signMessage']>>,
  ) =>
    encodeDeleGatorSignature(
      keyId,
      result.signature,
      result.webauthn.clientDataJSON,
      result.webauthn.authenticatorData,
    );

  const signMessage = async (args: { message: SignableMessage }) =>
    webAuthnAccount.signMessage(args).then(encodeSignature);
  const signTypedData = async <
    const TTypedData extends TypedData | Record<string, unknown>,
    TPrimaryType extends keyof TTypedData | 'EIP712Domain' = keyof TTypedData,
  >(
    typedDataDefinition: TypedDataDefinition<TTypedData, TPrimaryType>,
  ) => webAuthnAccount.signTypedData(typedDataDefinition).then(encodeSignature);

  const getStubSignature = async () => createDummyWebAuthnSignature(keyId);

  return {
    signMessage,
    signTypedData,
    getStubSignature,
  };
};

const resolveMultiSigSigner = (
  config: MultiSigSignerConfig,
): InternalSigner => {
  const resolvedSigners = config.map((signer) => {
    let individualSignMessage: InternalSigner['signMessage'];
    let individualSignTypedData: InternalSigner['signTypedData'];
    let address: Address;
    if ('walletClient' in signer) {
      const { signMessage, signTypedData } =
        resolveSignerFromWalletConfig(signer);
      individualSignMessage = signMessage;
      individualSignTypedData = signTypedData;

      address = signer.walletClient.account.address;
    } else {
      const { signMessage, signTypedData } =
        resolveSignerFromAccountConfig(signer);
      if (!signMessage) {
        throw new Error('Account does not support signMessage');
      }
      if (!signTypedData) {
        throw new Error('Account does not support signTypedData');
      }

      individualSignMessage = signMessage;
      individualSignTypedData = signTypedData;

      address = signer.account.address;
    }
    return {
      address,
      individualSignMessage,
      individualSignTypedData,
    };
  });

  const signMessage = async (args: { message: SignableMessage }) => {
    const addressAndSignatures = resolvedSigners.map(
      async ({ individualSignMessage, address }) => ({
        signature: await individualSignMessage(args),
        signer: address,
        type: 'ECDSA' as const,
      }),
    );

    const signatures = await Promise.all(addressAndSignatures);

    return aggregateSignature({
      signatures,
    });
  };

  const signTypedData = async <
    const TTypedData extends TypedData | Record<string, unknown>,
    TPrimaryType extends keyof TTypedData | 'EIP712Domain' = keyof TTypedData,
  >(
    typedDataDefinition: TypedDataDefinition<TTypedData, TPrimaryType>,
  ) => {
    const addressAndSignatures = resolvedSigners.map(
      async ({ individualSignTypedData, address }) => ({
        signature: await individualSignTypedData(typedDataDefinition),
        signer: address,
        type: 'ECDSA' as const,
      }),
    );

    const signatures = await Promise.all(addressAndSignatures);

    return aggregateSignature({
      signatures,
    });
  };

  const getStubSignature = async () =>
    concat(resolvedSigners.map(() => EOA_STUB_SIGNATURE));

  return {
    signMessage,
    signTypedData,
    getStubSignature,
  };
};

const resolveStateless7702Signer = (
  config: Stateless7702SignerConfig,
): InternalSigner => {
  if ('walletClient' in config) {
    return resolveSignerFromWalletConfig(config);
  } else if ('account' in config) {
    const { signMessage, signTypedData, getStubSignature } =
      resolveSignerFromAccountConfig(config);
    if (!signMessage) {
      throw new Error('Account does not support signMessage');
    }
    if (!signTypedData) {
      throw new Error('Account does not support signTypedData');
    }

    return {
      signMessage,
      signTypedData,
      getStubSignature,
    };
  }

  throw new Error('Invalid signer config');
};

/**
 * Resolve a signer from a configuration object.
 *
 * @param config - The configuration object.
 * @param config.implementation - The implementation type.
 * @param config.signer - The signer configuration object.
 * @returns The resolved signer.
 */
export function resolveSigner<TImplementation extends Implementation>(config: {
  implementation: TImplementation;
  signer: SignerConfigByImplementation<TImplementation>;
}): InternalSigner;

/**
 * Resolve a signer from a configuration object. If no signer is provided, return null.
 *
 * @param config - The configuration object.
 * @param config.implementation - The implementation type.
 * @param config.signer - The signer configuration object.
 * @returns The resolved signer or null if no signer is provided.
 */
export function resolveSigner<TImplementation extends Implementation>(config: {
  implementation: TImplementation;
  signer?: SignerConfigByImplementation<TImplementation>;
}): InternalSigner | null;

/**
 * Resolve a signer from a configuration object. If no signer is provided, return null.
 *
 * @param config - The configuration object.
 * @param config.implementation - The implementation type.
 * @param config.signer - The signer configuration object.
 * @returns The resolved signer or null if no signer is provided.
 */
export function resolveSigner<TImplementation extends Implementation>(config: {
  implementation: TImplementation;
  signer?: SignerConfigByImplementation<TImplementation>;
}): InternalSigner | null {
  const { implementation, signer } = config;

  if (!signer) {
    return null;
  }

  if (implementation === Implementation.Hybrid) {
    return resolveHybridSigner(signer as HybridSignerConfig);
  } else if (implementation === Implementation.MultiSig) {
    return resolveMultiSigSigner(signer as MultiSigSignerConfig);
  } else if (implementation === Implementation.Stateless7702) {
    return resolveStateless7702Signer(signer as Stateless7702SignerConfig);
  }
  throw new Error(`Implementation type '${implementation}' not supported`);
}
