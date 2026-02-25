import type {
  Erc20TokenPeriodicPermission as RpcErc20TokenPeriodicPermission,
  Erc20TokenStreamPermission as RpcErc20TokenStreamPermission,
  Erc20TokenRevocationPermission as RpcErc20TokenRevocationPermission,
  NativeTokenPeriodicPermission as RpcNativeTokenPeriodicPermission,
  NativeTokenStreamPermission as RpcNativeTokenStreamPermission,
  PermissionRequest,
  PermissionTypes as RpcPermissionTypes,
  Rule,
} from '@metamask/7715-permission-types';
import { hexToNumber, toHex } from 'viem';

import { isDefined, toHexOrThrow } from '../utils';
import type {
  Erc20TokenPeriodicPermission,
  Erc20TokenRevocationPermission,
  Erc20TokenStreamPermission,
  GetGrantedExecutionPermissionsResult,
  GetSupportedExecutionPermissionsResult,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionRequestParameter,
  PermissionTypes as DeveloperPermissionTypes,
  RpcGetGrantedExecutionPermissionsResult,
  RpcGetSupportedExecutionPermissionsResult,
} from './erc7715Types';

// =============================================================================
// Developer → RPC (request formatting)
// =============================================================================

/**
 * Converts a developer permission request to RPC format for wallet submission.
 *
 * @param parameters the permission request parameters
 * @returns the permission request in RPC format
 */
export function permissionRequestToRpc(
  parameters: PermissionRequestParameter,
): PermissionRequest<RpcPermissionTypes> {
  const { chainId, from, expiry } = parameters;

  const converter = getPermissionRequestToRpcConverter(
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
    permission: converter(parameters.permission),
    to: parameters.to,
    rules,
  };
}

type PermissionRequestToRpcConverter = (
  permission: DeveloperPermissionTypes,
) => RpcPermissionTypes;

/**
 * Get the permission request to RPC converter for the given permission type.
 *
 * @param permissionType the permission type
 * @returns the permission request to RPC converter for the given permission type
 */
function getPermissionRequestToRpcConverter(
  permissionType: string,
): PermissionRequestToRpcConverter {
  switch (permissionType) {
    case 'native-token-stream':
      return (permission) =>
        nativeTokenStreamPermissionToRpc(
          permission as NativeTokenStreamPermission,
        );
    case 'erc20-token-stream':
      return (permission) =>
        erc20TokenStreamPermissionToRpc(
          permission as Erc20TokenStreamPermission,
        );
    case 'native-token-periodic':
      return (permission) =>
        nativeTokenPeriodicPermissionToRpc(
          permission as NativeTokenPeriodicPermission,
        );
    case 'erc20-token-periodic':
      return (permission) =>
        erc20TokenPeriodicPermissionToRpc(
          permission as Erc20TokenPeriodicPermission,
        );
    case 'erc20-token-revocation':
      return (permission) =>
        erc20TokenRevocationPermissionToRpc(
          permission as Erc20TokenRevocationPermission,
        );
    default:
      throw new Error(`Unsupported permission type: ${permissionType}`);
  }
}

/**
 * Convert native token stream permission to RPC format.
 *
 * @param permission the native token stream permission
 * @returns the native token stream permission in RPC format
 */
function nativeTokenStreamPermissionToRpc(
  permission: NativeTokenStreamPermission,
): RpcNativeTokenStreamPermission {
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
 * Convert ERC20 token stream permission to RPC format.
 *
 * @param permission the erc20 token stream permission
 * @returns the erc20 token stream permission in RPC format
 */
function erc20TokenStreamPermissionToRpc(
  permission: Erc20TokenStreamPermission,
): RpcErc20TokenStreamPermission {
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
 * Convert native token periodic permission to RPC format.
 *
 * @param permission the native token periodic permission
 * @returns the native token periodic permission in RPC format
 */
function nativeTokenPeriodicPermissionToRpc(
  permission: NativeTokenPeriodicPermission,
): RpcNativeTokenPeriodicPermission {
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
 * Convert ERC20 token periodic permission to RPC format.
 *
 * @param permission the erc20 token periodic permission
 * @returns the erc20 token periodic permission in RPC format
 */
function erc20TokenPeriodicPermissionToRpc(
  permission: Erc20TokenPeriodicPermission,
): RpcErc20TokenPeriodicPermission {
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
 * Convert ERC20 token revocation permission to RPC format.
 *
 * @param permission the erc20 token revocation permission
 * @returns the erc20 token revocation permission in RPC format
 */
function erc20TokenRevocationPermissionToRpc(
  permission: Erc20TokenRevocationPermission,
): RpcErc20TokenRevocationPermission {
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

// =============================================================================
// RPC → Developer friendly types (response conversion)
// =============================================================================

/**
 * Converts RPC permission responses to developer-friendly types.
 * Converts chainId from hex to number, and token amounts from hex to bigint.
 *
 * @param result the RPC permission responses
 * @returns the developer-friendly permission responses
 */
export function permissionResponsesFromRpc(
  result: RpcGetGrantedExecutionPermissionsResult,
): GetGrantedExecutionPermissionsResult {
  return result.map((permission) => ({
    ...permission,
    chainId: hexToNumber(permission.chainId),
    permission: permissionTypeFromRpc(permission.permission),
  }));
}

/**
 * Converts RPC permission type data to developer-friendly types.
 * Converts hex amount fields to bigint.
 *
 * @param permission the RPC permission
 * @returns the developer-friendly permission
 */
export function permissionTypeFromRpc(
  permission: RpcPermissionTypes,
): DeveloperPermissionTypes {
  const convertedData: Record<string, unknown> = { ...permission.data };

  if ('amountPerSecond' in convertedData && convertedData.amountPerSecond) {
    convertedData.amountPerSecond = BigInt(
      convertedData.amountPerSecond as `0x${string}`,
    );
  }

  if ('periodAmount' in convertedData && convertedData.periodAmount) {
    convertedData.periodAmount = BigInt(
      convertedData.periodAmount as `0x${string}`,
    );
  }

  if ('initialAmount' in convertedData && convertedData.initialAmount) {
    convertedData.initialAmount = BigInt(
      convertedData.initialAmount as `0x${string}`,
    );
  }

  if ('maxAmount' in convertedData && convertedData.maxAmount) {
    convertedData.maxAmount = BigInt(convertedData.maxAmount as `0x${string}`);
  }

  return {
    ...permission,
    data: convertedData,
  } as DeveloperPermissionTypes;
}

/**
 * Converts RPC supported permissions result to developer-friendly types.
 * Converts chain IDs from hex to numbers.
 *
 * @param result the RPC supported permissions result
 * @returns the developer-friendly supported permissions result
 */
export function rpcSupportedPermissionsToDeveloper(
  result: RpcGetSupportedExecutionPermissionsResult,
): GetSupportedExecutionPermissionsResult {
  const converted: GetSupportedExecutionPermissionsResult = {};

  for (const [permissionType, permissionInfo] of Object.entries(result)) {
    converted[permissionType] = {
      chainIds: permissionInfo.chainIds.map((chainId) => hexToNumber(chainId)),
      ruleTypes: permissionInfo.ruleTypes,
    };
  }

  return converted;
}
