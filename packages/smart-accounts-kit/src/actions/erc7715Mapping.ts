import type {
  Erc20TokenAllowancePermission as RpcErc20TokenAllowancePermission,
  Erc20TokenPeriodicPermission as RpcErc20TokenPeriodicPermission,
  Erc20TokenStreamPermission as RpcErc20TokenStreamPermission,
  Erc20TokenRevocationPermission as RpcErc20TokenRevocationPermission,
  NativeTokenAllowancePermission as RpcNativeTokenAllowancePermission,
  NativeTokenPeriodicPermission as RpcNativeTokenPeriodicPermission,
  NativeTokenStreamPermission as RpcNativeTokenStreamPermission,
  PermissionRequest,
  PermissionTypes as RpcPermissionTypes,
  Rule,
} from '@metamask/7715-permission-types';
import { getAddress, hexToNumber, isAddress, toHex, type Hex } from 'viem';

import { isDefined, toHexOrThrow } from '../utils';
import type {
  Erc20TokenAllowancePermission,
  Erc20TokenPeriodicPermission,
  Erc20TokenRevocationPermission,
  Erc20TokenStreamPermission,
  GetGrantedExecutionPermissionsResult,
  GetSupportedExecutionPermissionsResult,
  NativeTokenAllowancePermission,
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
  const { chainId, from, expiry, redeemer, payee } = parameters;

  const converter = getPermissionRequestToRpcConverter(
    parameters.permission.type,
  );

  const rules: Rule[] = [];
  if (isDefined(expiry)) {
    rules.push({
      type: 'expiry',
      data: {
        timestamp: expiry,
      },
    });
  }
  if (isDefined(redeemer)) {
    if (redeemer.length === 0) {
      throw new Error(
        'Invalid redeemers: must specify at least one redeemer address',
      );
    }
    const addresses: Hex[] = [];
    for (const addr of redeemer) {
      if (!isAddress(addr)) {
        throw new Error('Invalid redeemers: must be a valid address');
      }
      addresses.push(getAddress(addr));
    }
    rules.push({
      type: 'redeemer',
      data: { addresses },
    });
  }
  if (isDefined(payee)) {
    if (payee.length === 0) {
      throw new Error(
        'Invalid payees: must specify at least one payee address',
      );
    }
    const payeeAddresses: Hex[] = [];
    for (const addr of payee) {
      if (!isAddress(addr)) {
        throw new Error('Invalid payees: must be a valid address');
      }
      payeeAddresses.push(getAddress(addr));
    }
    rules.push({
      type: 'payee',
      data: { addresses: payeeAddresses },
    });
  }

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
    case 'native-token-allowance':
      return (permission) =>
        nativeTokenAllowancePermissionToRpc(
          permission as NativeTokenAllowancePermission,
        );
    case 'erc20-token-periodic':
      return (permission) =>
        erc20TokenPeriodicPermissionToRpc(
          permission as Erc20TokenPeriodicPermission,
        );
    case 'erc20-token-allowance':
      return (permission) =>
        erc20TokenAllowancePermissionToRpc(
          permission as Erc20TokenAllowancePermission,
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
 * Convert native token fixed allowance permission to RPC format.
 *
 * @param permission the native token fixed allowance permission
 * @returns the native token fixed allowance permission in RPC format
 */
function nativeTokenAllowancePermissionToRpc(
  permission: NativeTokenAllowancePermission,
): RpcNativeTokenAllowancePermission {
  const {
    data: { allowanceAmount, startTime, justification },
    isAdjustmentAllowed,
  } = permission;

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'native-token-allowance',
    data: {
      allowanceAmount: toHexOrThrow(allowanceAmount, 'allowanceAmount'),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

/**
 * Convert ERC-20 token fixed allowance permission to RPC format.
 *
 * @param permission the ERC-20 token fixed allowance permission
 * @returns the ERC-20 token fixed allowance permission in RPC format
 */
function erc20TokenAllowancePermissionToRpc(
  permission: Erc20TokenAllowancePermission,
): RpcErc20TokenAllowancePermission {
  const {
    data: { tokenAddress, allowanceAmount, startTime, justification },
    isAdjustmentAllowed,
  } = permission;

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };

  return {
    type: 'erc20-token-allowance',
    data: {
      tokenAddress: toHexOrThrow(tokenAddress, 'tokenAddress'),
      allowanceAmount: toHexOrThrow(allowanceAmount, 'allowanceAmount'),
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
    rules: normalizeRulesFromRpc(permission.rules),
  }));
}

/**
 * Checksums addresses in `redeemer` and `payee` rules; other rules are returned unchanged.
 *
 * @param rules - Rules from the wallet RPC response.
 * @returns The same list with normalized addresses, or null/undefined if that was the input.
 */
function normalizeRulesFromRpc(
  rules: Rule[] | null | undefined,
): Rule[] | null | undefined {
  if (rules === undefined || rules === null) {
    return rules;
  }
  return rules.map((rule) => {
    if (rule.type !== 'redeemer' && rule.type !== 'payee') {
      return rule;
    }
    const rawAddresses = (rule.data as { addresses?: unknown } | undefined)
      ?.addresses;
    if (!Array.isArray(rawAddresses)) {
      return rule;
    }
    return {
      type: rule.type,
      data: {
        addresses: rawAddresses.map((addr) => getAddress(addr as Hex)),
      },
    };
  });
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

  if ('allowanceAmount' in convertedData && convertedData.allowanceAmount) {
    convertedData.allowanceAmount = BigInt(
      convertedData.allowanceAmount as `0x${string}`,
    );
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
