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
import { toHex } from 'viem';
import type { Address } from 'viem';

import { isDefined, toHexOrThrow } from '../utils';
import type { MetaMaskExtensionClient } from './erc7715Types';

export type {
  GetGrantedExecutionPermissionsResult,
  GetSupportedExecutionPermissionsResult,
  MetaMaskExtensionClient,
  MetaMaskExtensionSchema,
  SupportedPermissionInfo,
} from './erc7715Types';

type PermissionParameter = {
  type: string;
  data: Record<string, unknown>;
  isAdjustmentAllowed: boolean;
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
  const { chainId, from, expiry } = parameters;

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
    }),
    to: parameters.to,
    rules,
  };
}

type PermissionFormatter = (params: {
  permission: PermissionParameter;
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
      return ({ permission }) =>
        formatNativeTokenStreamPermission({
          permission: permission as NativeTokenStreamPermissionParameter,
        });
    case 'erc20-token-stream':
      return ({ permission }) =>
        formatErc20TokenStreamPermission({
          permission: permission as Erc20TokenStreamPermissionParameter,
        });

    case 'native-token-periodic':
      return ({ permission }) =>
        formatNativeTokenPeriodicPermission({
          permission: permission as NativeTokenPeriodicPermissionParameter,
        });
    case 'erc20-token-periodic':
      return ({ permission }) =>
        formatErc20TokenPeriodicPermission({
          permission: permission as Erc20TokenPeriodicPermissionParameter,
        });
    case 'erc20-token-revocation':
      return ({ permission }) =>
        formatErc20TokenRevocationPermission({
          permission: permission as Erc20TokenRevocationPermissionParameter,
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
 * @returns The formatted permission object.
 */
function formatNativeTokenStreamPermission({
  permission,
}: {
  permission: NativeTokenStreamPermissionParameter;
}): NativeTokenStreamPermission {
  const {
    data: {
      initialAmount,
      justification,
      maxAmount,
      startTime,
      amountPerSecond,
    },
    isAdjustmentAllowed,
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
 * @returns The formatted Erc20TokenStreamPermission object.
 */
function formatErc20TokenStreamPermission({
  permission,
}: {
  permission: Erc20TokenStreamPermissionParameter;
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
    isAdjustmentAllowed,
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
 * @returns The formatted NativeTokenPeriodicPermission object.
 */
function formatNativeTokenPeriodicPermission({
  permission,
}: {
  permission: NativeTokenPeriodicPermissionParameter;
}): NativeTokenPeriodicPermission {
  const {
    data: { periodAmount, periodDuration, startTime, justification },
    isAdjustmentAllowed,
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
 * @returns The formatted Erc20TokenPeriodicPermission object.
 */
function formatErc20TokenPeriodicPermission({
  permission,
}: {
  permission: Erc20TokenPeriodicPermissionParameter;
}): Erc20TokenPeriodicPermission {
  const {
    data: {
      tokenAddress,
      periodAmount,
      periodDuration,
      startTime,
      justification,
    },
    isAdjustmentAllowed,
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
 * @returns The formatted Erc20TokenRevocationPermission object.
 */
function formatErc20TokenRevocationPermission({
  permission,
}: {
  permission: Erc20TokenRevocationPermissionParameter;
}): Erc20TokenRevocationPermission {
  const {
    data: { justification },
    isAdjustmentAllowed,
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
