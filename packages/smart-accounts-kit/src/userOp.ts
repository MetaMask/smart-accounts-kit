import { concat, encodeAbiParameters, keccak256, pad, toHex } from 'viem';
import type { Address, Hex, TypedData } from 'viem';
import { toPackedUserOperation } from 'viem/account-abstraction';
import { signTypedData } from 'viem/accounts';

import type { OptionalUserOpProps, PackedUserOperationStruct } from './types';

// v7 off-chain user operation, hexlified incoming data from rpc call
export type UserOperationV07Hexlify = {
  sender: Hex;
  nonce: Hex;
  factory?: Hex;
  factoryData?: Hex;
  callData: Hex;
  callGasLimit: Hex;

  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;

  paymaster?: Hex;
  paymasterVerificationGasLimit?: Hex;
  paymasterPostOpGasLimit?: Hex;
  paymasterData?: Hex;

  signature: Hex;
};

// v7 off-chain user operation with BigInt fields
export type UserOperationV07 = {
  sender: Hex;
  nonce: bigint;
  factory?: Hex;
  factoryData?: Hex;
  callData: Hex;

  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;

  paymaster?: Hex;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
  paymasterData?: Hex;

  signature: Hex;
};

/**
 * Creates a raw user operation data structure.
 *
 * @param sender - The smart account taking some action.
 * @param nonce - A nonce, ideally fetched from the Entry Point.
 * @param callData - Calldata to invoke on some contract.
 * @param signature - The signature for the user operation.
 * @param options - Optional properties for the user operation.
 * @returns The created raw user operation data structure.
 */
export const createRawUserOp = (
  sender: Hex,
  nonce: bigint,
  callData: Hex,
  signature: Hex = '0x',
  options?: OptionalUserOpProps,
): UserOperationV07 => ({
  sender,
  nonce,
  callData,
  factory: options?.factory,
  factoryData: options?.factoryData,
  callGasLimit: options?.callGasLimit ?? 0n,
  verificationGasLimit: options?.verificationGasLimit ?? 0n,
  preVerificationGas: options?.preVerificationGas ?? 0n,
  maxFeePerGas: options?.maxFeePerGas ?? 0n,
  maxPriorityFeePerGas: options?.maxPriorityFeePerGas ?? 0n,
  paymaster: options?.paymaster,
  paymasterVerificationGasLimit: options?.paymasterVerificationGasLimit,
  paymasterPostOpGasLimit: options?.paymasterPostOpGasLimit,
  paymasterData: options?.paymasterData,
  signature,
});

// //////////////////////////////////////////////////////////////////////////////////////

// TODO: These userOp functions are duplicated in ./apps/ew-client/src/utils/userOpBuilder.ts. We should move them to a shared location along with test(./apps/ew-client/test/UserOpBuilder.test.ts) to avoid duplication
/**
 * Generates a salt value for address derivation.
 *
 * @param salt - Optional salt value.
 * @returns The chosen salt value.
 */
export const getSalt = (salt?: Hex): Hex => {
  return salt ?? '0x0';
};

export const getPaymasterAndData = (userOp: UserOperationV07): Hex => {
  let paymasterAndData: Hex;
  if (userOp.paymaster) {
    paymasterAndData = concat([
      userOp.paymaster,
      pad(toHex(userOp.paymasterVerificationGasLimit ?? 0n), {
        size: 16,
      }),
      pad(toHex(userOp.paymasterPostOpGasLimit ?? 0n), {
        size: 16,
      }),
      userOp.paymasterData ?? '0x',
    ]);
  } else {
    paymasterAndData = '0x';
  }

  return paymasterAndData;
};

export const getInitCode = (userOp: UserOperationV07): Hex => {
  return userOp.factory
    ? concat([userOp.factory, userOp.factoryData ?? ('0x' as Hex)])
    : '0x';
};

export const getAccountGasLimits = (userOp: UserOperationV07): Hex => {
  return concat([
    pad(toHex(userOp.verificationGasLimit), {
      size: 16,
    }),
    pad(toHex(userOp.callGasLimit), { size: 16 }),
  ]);
};

export const getGasFees = (userOp: UserOperationV07): Hex => {
  return concat([
    pad(toHex(userOp.maxPriorityFeePerGas), {
      size: 16,
    }),
    pad(toHex(userOp.maxFeePerGas), { size: 16 }),
  ]);
};

/**
 * Packs a user operation into a `PackedUserOperationStruct` object.
 *
 * @param userOp - The user operation to pack.
 * @returns The packed user operation.
 */
export const packUserOp = (
  userOp: UserOperationV07,
): PackedUserOperationStruct => {
  const packedOp = {
    sender: userOp.sender,
    nonce: BigInt(userOp.nonce),
    initCode: getInitCode(userOp),
    callData: userOp.callData,
    accountGasLimits: getAccountGasLimits(userOp),
    preVerificationGas: BigInt(userOp.preVerificationGas),
    gasFees: getGasFees(userOp),
    paymasterAndData: getPaymasterAndData(userOp),
    signature: userOp.signature,
  };

  return packedOp;
};

/**
 * Calculates the user operation hash for a given packed user operation.
 *
 * @param packedOp - The packed user operation.
 * @param entryPoint - The entry point address.
 * @param chainId - The chain ID.
 * @returns The user operation hash.
 */
export const createUserOpHashV07 = (
  packedOp: PackedUserOperationStruct,
  entryPoint: Hex,
  chainId: bigint,
) => {
  const hash = keccak256(
    encodeAbiParameters(
      [
        {
          name: 'sender',
          type: 'address',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'initCodeHash',
          type: 'bytes32',
        },
        {
          name: 'callDataHash',
          type: 'bytes32',
        },
        {
          name: 'accountGasLimits',
          type: 'bytes32',
        },
        {
          name: 'preVerificationGas',
          type: 'uint256',
        },
        {
          name: 'gasFees',
          type: 'bytes32',
        },
        {
          name: 'paymasterAndDataHash',
          type: 'bytes32',
        },
      ],
      [
        packedOp.sender,
        packedOp.nonce,
        keccak256(packedOp.initCode),
        keccak256(packedOp.callData),
        packedOp.accountGasLimits,
        packedOp.preVerificationGas,
        packedOp.gasFees,
        keccak256(packedOp.paymasterAndData),
      ],
    ),
  );

  return keccak256(
    encodeAbiParameters(
      [
        {
          name: 'userOpHash',
          type: 'bytes32',
        },
        {
          name: 'entryPointAddress',
          type: 'address',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
      ],
      [hash, entryPoint, chainId],
    ),
  );
};

export const SIGNABLE_USER_OP_TYPED_DATA: TypedData = {
  PackedUserOperation: [
    { name: 'sender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'initCode', type: 'bytes' },
    { name: 'callData', type: 'bytes' },
    { name: 'accountGasLimits', type: 'bytes32' },
    { name: 'preVerificationGas', type: 'uint256' },
    { name: 'gasFees', type: 'bytes32' },
    { name: 'paymasterAndData', type: 'bytes' },
    { name: 'entryPoint', type: 'address' },
  ],
} as const;

/**
 * Prepares typed data for user operation signing.
 * This is an internal helper function that's not exposed in the public API.
 *
 * @param params - The parameters for preparing the typed data.
 * @param params.userOperation - The user operation to prepare for signing.
 * @param params.entryPoint - The entry point contract address.
 * @param params.entryPoint.address - The address of the entry point contract.
 * @param params.chainId - The chain ID that the entry point is deployed on.
 * @param params.name - The name of the domain of the implementation contract.
 * @param params.version - The version of the domain of the implementation contract.
 * @param params.address - The address of the smart account.
 * @returns The prepared typed data for signing.
 */
export const prepareSignUserOperationTypedData = ({
  userOperation,
  entryPoint,
  chainId,
  name,
  address,
  version = '1',
}: {
  userOperation: Omit<UserOperationV07, 'signature'>;
  entryPoint: { address: Address };
  chainId: number;
  name: 'HybridDeleGator' | 'MultiSigDeleGator';
  address: Address;
  version?: string;
}) => {
  const packedUserOp = toPackedUserOperation({
    ...userOperation,
    signature: '0x',
  });

  return {
    domain: {
      chainId,
      name,
      version,
      verifyingContract: address,
    },
    types: SIGNABLE_USER_OP_TYPED_DATA,
    primaryType: 'PackedUserOperation' as const,
    message: { ...packedUserOp, entryPoint: entryPoint.address },
  };
};

/**
 * Signs a user operation using a private key.
 *
 * @param params - The parameters for signing the user operation.
 * @param params.privateKey - The private key to use for signing.
 * @param params.userOperation - The user operation to sign.
 * @param params.entryPoint - The entry point contract address.
 * @param params.chainId - The chain ID that the entry point is deployed on.
 * @param params.name - The name of the domain of the implementation contract.
 * @param params.version - The version of the domain of the implementation contract.
 * @param params.address - The address of the smart account.
 * @param params.entryPoint.address - The address of the entry point contract.
 * @returns The signature of the user operation.
 */
export const signUserOperation = async ({
  privateKey,
  userOperation,
  entryPoint,
  chainId,
  name,
  address,
  version = '1',
}: {
  privateKey: Hex;
  userOperation: Omit<UserOperationV07, 'signature'>;
  entryPoint: { address: Address };
  chainId: number;
  address: Address;
  name: 'HybridDeleGator' | 'MultiSigDeleGator';
  version?: string;
}) => {
  const typedData = prepareSignUserOperationTypedData({
    userOperation,
    entryPoint,
    chainId,
    name,
    address,
    version,
  });

  return signTypedData({
    privateKey,
    ...typedData,
  });
};
