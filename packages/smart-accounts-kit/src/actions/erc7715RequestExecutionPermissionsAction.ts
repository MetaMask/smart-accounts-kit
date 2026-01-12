import type {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  Erc20TokenRevocationPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionRequest,
  PermissionResponse,
  PermissionTypes,
  Rule,
  Hex,
} from '@metamask/7715-permission-types';
import { isHex, toHex } from 'viem';
import type {
  Client,
  Account,
  RpcSchema,
  Transport,
  Chain,
  Address,
} from 'viem';

/**
 * RPC schema for MetaMask related methods.
 *
 * Extends the base RPC schema with methods specific to interacting with EIP-7715:
 * - `wallet_invokeSnap`: Invokes a method on a specific Snap.
 */
export type MetaMaskExtensionSchema = RpcSchema &
  [
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Method: 'wallet_requestExecutionPermissions';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Params: PermissionRequest<PermissionTypes>[];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ReturnType: PermissionResponse<PermissionTypes>[];
    },
  ];

/**
 * A Viem client extended with MetaMask Snap-specific RPC methods.
 *
 * This client type allows for interaction with MetaMask Snaps through
 * the standard Viem client interface, with added type safety for
 * Snap-specific methods.
 */
export type MetaMaskExtensionClient = Client<
  Transport,
  Chain | undefined,
  Account | undefined,
  MetaMaskExtensionSchema
>;

type PermissionParameter = {
  type: string;
  data: Record<string, unknown>;
};

/**
 * Represents a native token stream permission.
 * This allows for continuous token streaming with defined parameters.
 */
export type NativeTokenStreamPermissionParameter = PermissionParameter & {
  type: 'native-token-stream';
  data: {
    amountPerSecond: bigint;
    initialAmount?: bigint;
    maxAmount?: bigint;
    startTime?: number;
    justification?: string;
  };
};

/**
 * Represents an ERC-20 token stream permission.
 * This allows for continuous ERC-20 token streaming with defined parameters.
 */
export type Erc20TokenStreamPermissionParameter = PermissionParameter & {
  type: 'erc20-token-stream';
  data: {
    tokenAddress: Address;
    amountPerSecond: bigint;
    initialAmount?: bigint;
    maxAmount?: bigint;
    startTime?: number;
    justification?: string;
  };
};

/**
 * Represents a native token periodic permission.
 * This allows for periodic native token transfers with defined parameters.
 */
export type NativeTokenPeriodicPermissionParameter = PermissionParameter & {
  type: 'native-token-periodic';
  data: {
    periodAmount: bigint;
    periodDuration: number;
    startTime?: number;
    justification?: string;
  };
};

/**
 * Represents an ERC-20 token periodic permission.
 * This allows for periodic ERC-20 token transfers with defined parameters.
 */
export type Erc20TokenPeriodicPermissionParameter = PermissionParameter & {
  type: 'erc20-token-periodic';
  data: {
    tokenAddress: Address;
    periodAmount: bigint;
    periodDuration: number;
    startTime?: number;
    justification?: string;
  };
};

/**
 * Represents an ERC-20 token revocation permission.
 * This allows for revoking an ERC-20 token allowance.
 */
export type Erc20TokenRevocationPermissionParameter = PermissionParameter & {
  type: 'erc20-token-revocation';
  data: {
    justification?: string;
  };
};

export type SupportedPermissionParams =
  | NativeTokenStreamPermissionParameter
  | Erc20TokenStreamPermissionParameter
  | NativeTokenPeriodicPermissionParameter
  | Erc20TokenPeriodicPermissionParameter
  | Erc20TokenRevocationPermissionParameter;

/**
 * Represents a single permission request.
 */
export type PermissionRequestParameter = {
  chainId: number;
  // The permission to grant to the user.
  permission: SupportedPermissionParams;
  // Whether the caller allows the permission to be adjusted.
  isAdjustmentAllowed: boolean;
  // Account to assign the permission to.
  to: Hex;
  // address from which the permission should be granted.
  from?: Address | undefined | null;
  // Timestamp (in seconds) that specifies the time by which this permission MUST expire.
  expiry?: number | undefined | null;
};

/**
 * Parameters for the RequestExecutionPermissions action.
 *
 * @template Signer - The type of the signer, either an Address or Account.
 */
export type RequestExecutionPermissionsParameters =
  PermissionRequestParameter[];

/**
 * Return type for the request execution permissions action.
 */
export type RequestExecutionPermissionsReturnType =
  PermissionResponse<PermissionTypes>[];

/**
 * Grants permissions according to EIP-7715 specification.
 *
 * @template Signer - The type of the signer, either an Address or Account.
 * @param client - The client to use for the request.
 * @param parameters - The permissions requests to grant.
 * @returns A promise that resolves to the permission responses.
 * @description
 * This function formats the permissions requests and invokes the wallet method to grant permissions.
 * It will throw an error if the permissions could not be granted.
 */
export async function erc7715RequestExecutionPermissionsAction(
  client: MetaMaskExtensionClient,
  parameters: RequestExecutionPermissionsParameters,
): Promise<RequestExecutionPermissionsReturnType> {
  const formattedPermissionRequest = parameters.map(formatPermissionsRequest);

  const result = await client.request(
    {
      method: 'wallet_requestExecutionPermissions',
      params: formattedPermissionRequest,
    },
    { retryCount: 0 },
  );

  if (!result) {
    throw new Error('Failed to grant permissions');
  }

  return result;
}

/**
 * Formats a permissions request for submission to the wallet.
 *
 * @param parameters - The permissions request to format.
 * @returns The formatted permissions request.
 * @internal
 */
function formatPermissionsRequest(
  parameters: PermissionRequestParameter,
): PermissionRequest<PermissionTypes> {
  const { chainId, from, expiry, isAdjustmentAllowed } = parameters;

  const permissionFormatter = getPermissionFormatter(
    parameters.permission.type,
  );

  const rules: Rule[] = isDefined(expiry)
    ? [
        {
          type: 'expiry',
          data: {
            timestamp: expiry,
          },
        },
      ]
    : [];

  const optionalFields = {
    ...(from ? { from } : {}),
  };

  return {
    ...optionalFields,
    chainId: toHex(chainId),
    permission: permissionFormatter({
      permission: parameters.permission,
      isAdjustmentAllowed,
    }),
    to: parameters.to,
    rules,
  };
}

/**
 * Checks if a value is defined (not null or undefined).
 *
 * @param value - The value to check.
 * @returns A boolean indicating whether the value is defined.
 */
function isDefined<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== undefined && value !== null;
}

/**
 * Asserts that a value is defined (not null or undefined).
 *
 * @param value - The value to check.
 * @param parameterName - Optional: The name of the parameter that is being checked.
 * @throws {Error} If the value is null or undefined.
 */
function assertIsDefined<TValue>(
  value: TValue | null | undefined,
  parameterName?: string,
): asserts value is TValue {
  if (!isDefined(value)) {
    throw new Error(
      `Invalid parameters: ${parameterName ?? 'value'} is required`,
    );
  }
}

/**
 * Converts a value to a hex string or throws an error if the value is invalid.
 *
 * @param value - The value to convert to hex.
 * @param parameterName - Optional: The name of the parameter that is being converted to hex.
 * @returns The value as a hex string.
 */
function toHexOrThrow(
  value: Parameters<typeof toHex>[0] | undefined,
  parameterName?: string,
) {
  assertIsDefined(value, parameterName);

  if (typeof value === 'string') {
    if (!isHex(value)) {
      throw new Error(
        `Invalid parameters: ${parameterName ?? 'value'} is not a valid hex value`,
      );
    }
    return value;
  }

  return toHex(value);
}

type PermissionFormatter = (params: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) => PermissionTypes;

/**
 * Gets the appropriate formatter function for a specific permission type.
 *
 * @param permissionType - The type of permission to format.
 * @returns A formatter function for the specified permission type.
 */
function getPermissionFormatter(permissionType: string): PermissionFormatter {
  switch (permissionType) {
    case 'native-token-stream':
      return ({ permission, isAdjustmentAllowed }) =>
        formatNativeTokenStreamPermission({
          permission: permission as NativeTokenStreamPermissionParameter,
          isAdjustmentAllowed,
        });
    case 'erc20-token-stream':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenStreamPermission({
          permission: permission as Erc20TokenStreamPermissionParameter,
          isAdjustmentAllowed,
        });

    case 'native-token-periodic':
      return ({ permission, isAdjustmentAllowed }) =>
        formatNativeTokenPeriodicPermission({
          permission: permission as NativeTokenPeriodicPermissionParameter,
          isAdjustmentAllowed,
        });
    case 'erc20-token-periodic':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenPeriodicPermission({
          permission: permission as Erc20TokenPeriodicPermissionParameter,
          isAdjustmentAllowed,
        });
    case 'erc20-token-revocation':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenRevocationPermission({
          permission: permission as Erc20TokenRevocationPermissionParameter,
          isAdjustmentAllowed,
        });
    default:
      throw new Error(`Unsupported permission type: ${permissionType}`);
  }
}

/**
 * Formats a native token stream permission for the wallet.
 *
 * @param permission - The native token stream permission to format.
 * @param permission.permission - The native token stream permission to format.
 * @param permission.isAdjustmentAllowed - Whether the permission is allowed to be adjusted.
 * @returns The formatted permission object.
 */
function formatNativeTokenStreamPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: NativeTokenStreamPermissionParameter;
  isAdjustmentAllowed: boolean;
}): NativeTokenStreamPermission {
  const {
    data: {
      initialAmount,
      justification,
      maxAmount,
      startTime,
      amountPerSecond,
    },
  } = permission;

  const optionalFields = {
    ...(isDefined(initialAmount) && {
      initialAmount: toHexOrThrow(initialAmount, 'initialAmount'),
    }),
    ...(isDefined(maxAmount) && {
      maxAmount: toHexOrThrow(maxAmount, 'maxAmount'),
    }),
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'native-token-stream',
    data: {
      amountPerSecond: toHexOrThrow(amountPerSecond, 'amountPerSecond'),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

/**
 * Formats an ERC-20 token stream permission parameter into the required
 * Erc20TokenStreamPermission object, converting numeric values to hex strings
 * and including only specified optional fields.
 *
 * @param params - The parameters for formatting the ERC-20 token stream permission.
 * @param params.permission - The ERC-20 token stream permission parameter to format.
 * @param params.isAdjustmentAllowed - Whether adjustment of the stream is allowed.
 * @returns The formatted Erc20TokenStreamPermission object.
 */
function formatErc20TokenStreamPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: Erc20TokenStreamPermissionParameter;
  isAdjustmentAllowed: boolean;
}): Erc20TokenStreamPermission {
  const {
    data: {
      tokenAddress,
      amountPerSecond,
      initialAmount,
      startTime,
      maxAmount,
      justification,
    },
  } = permission;

  const optionalFields = {
    ...(isDefined(initialAmount) && {
      initialAmount: toHexOrThrow(initialAmount, 'initialAmount'),
    }),
    ...(isDefined(maxAmount) && {
      maxAmount: toHexOrThrow(maxAmount, 'maxAmount'),
    }),
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'erc20-token-stream',
    data: {
      tokenAddress: toHexOrThrow(tokenAddress, 'tokenAddress'),
      amountPerSecond: toHexOrThrow(amountPerSecond, 'amountPerSecond'),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

/**
 * Formats a native token periodic permission for submission to the wallet.
 *
 * @param params - The parameters for formatting the native token periodic permission.
 * @param params.permission - The native token periodic permission parameter to format.
 * @param params.isAdjustmentAllowed - Whether the permission is allowed to be adjusted.
 * @returns The formatted NativeTokenPeriodicPermission object.
 */
function formatNativeTokenPeriodicPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: NativeTokenPeriodicPermissionParameter;
  isAdjustmentAllowed: boolean;
}): NativeTokenPeriodicPermission {
  const {
    data: { periodAmount, periodDuration, startTime, justification },
  } = permission;

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'native-token-periodic',
    data: {
      periodAmount: toHexOrThrow(periodAmount, 'periodAmount'),
      periodDuration: Number(periodDuration),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

/**
 * Formats an ERC20 token periodic permission for submission to the wallet.
 *
 * @param params - The parameters for formatting the ERC20 token periodic permission.
 * @param params.permission - The ERC20 token periodic permission parameter to format.
 * @param params.isAdjustmentAllowed - Whether the permission is allowed to be adjusted.
 * @returns The formatted Erc20TokenPeriodicPermission object.
 */
function formatErc20TokenPeriodicPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: Erc20TokenPeriodicPermissionParameter;
  isAdjustmentAllowed: boolean;
}): Erc20TokenPeriodicPermission {
  const {
    data: {
      tokenAddress,
      periodAmount,
      periodDuration,
      startTime,
      justification,
    },
  } = permission;

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'erc20-token-periodic',
    data: {
      tokenAddress: toHexOrThrow(tokenAddress, 'tokenAddress'),
      periodAmount: toHexOrThrow(periodAmount, 'periodAmount'),
      periodDuration: Number(periodDuration),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

/**
 * Formats an ERC-20 token revocation permission for submission to the wallet.
 *
 * @param params - The parameters for formatting the ERC-20 token revocation permission.
 * @param params.permission - The ERC-20 token revocation permission parameter to format.
 * @param params.isAdjustmentAllowed - Whether the permission is allowed to be adjusted.
 * @returns The formatted Erc20TokenRevocationPermission object.
 */
function formatErc20TokenRevocationPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: Erc20TokenRevocationPermissionParameter;
  isAdjustmentAllowed: boolean;
}): Erc20TokenRevocationPermission {
  const {
    data: { justification },
  } = permission;

  const data = {
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'erc20-token-revocation',
    data,
    isAdjustmentAllowed,
  };
}
