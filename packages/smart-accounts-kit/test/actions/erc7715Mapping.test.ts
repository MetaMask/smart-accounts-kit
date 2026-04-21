import type { Hex } from 'viem';
import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';

import {
  permissionRequestToRpc,
  permissionResponsesFromRpc,
  permissionTypeFromRpc,
  rpcSupportedPermissionsToDeveloper,
} from '../../src/actions/erc7715Mapping';
import type {
  RpcGetGrantedExecutionPermissionsResult,
  RpcGetSupportedExecutionPermissionsResult,
} from '../../src/actions/erc7715Types';

describe('erc7715Mapping', () => {
  const basePermissionFields = {
    chainId: '0x1',
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    context: '0x1234567890abcdef',
    dependencies: [] as { factory: Hex; factoryData: Hex }[],
    delegationManager: '0x0987654321098765432109876543210987654321',
    rules: [] as { type: string; data: Record<string, unknown> }[],
  } as const;

  describe('permissionTypeFromRpc', () => {
    it('converts native-token-stream: amountPerSecond, initialAmount, maxAmount hex → bigint', () => {
      const rpcPermission = {
        type: 'native-token-stream',
        isAdjustmentAllowed: true,
        data: {
          amountPerSecond: '0x64',
          initialAmount: '0x0',
          maxAmount: '0xde0b6b3a7640000',
          startTime: 1700000000,
        },
      } as const;

      const result = permissionTypeFromRpc(rpcPermission);

      expect(result).toStrictEqual({
        type: 'native-token-stream',
        isAdjustmentAllowed: true,
        data: {
          amountPerSecond: 0x64n,
          initialAmount: 0x0n,
          maxAmount: 0xde0b6b3a7640000n,
          startTime: 1700000000,
        },
      });
    });

    it('converts native-token-periodic: periodAmount hex → bigint', () => {
      const rpcPermission = {
        type: 'native-token-periodic',
        isAdjustmentAllowed: false,
        data: {
          periodAmount: '0x2386f26fc10000',
          periodDuration: 86400,
          startTime: 1700000000,
        },
      } as const;

      const result = permissionTypeFromRpc(rpcPermission);

      expect(result).toStrictEqual({
        type: 'native-token-periodic',
        isAdjustmentAllowed: false,
        data: {
          periodAmount: 0x2386f26fc10000n,
          periodDuration: 86400,
          startTime: 1700000000,
        },
      });
    });

    it('converts erc20-token-stream: amountPerSecond, initialAmount, maxAmount hex → bigint', () => {
      const rpcPermission = {
        type: 'erc20-token-stream',
        isAdjustmentAllowed: true,
        data: {
          amountPerSecond: '0xde0b6b3a7640000',
          initialAmount: '0x1',
          maxAmount: '0x2',
          tokenAddress: '0x1234567890123456789012345678901234567890',
        },
      } as const;

      const result = permissionTypeFromRpc(rpcPermission);

      expect(result).toStrictEqual({
        type: 'erc20-token-stream',
        isAdjustmentAllowed: true,
        data: {
          amountPerSecond: 0xde0b6b3a7640000n,
          initialAmount: 0x1n,
          maxAmount: 0x2n,
          tokenAddress: '0x1234567890123456789012345678901234567890',
        },
      });
    });

    it('converts erc20-token-periodic: periodAmount hex → bigint', () => {
      const rpcPermission = {
        type: 'erc20-token-periodic',
        isAdjustmentAllowed: false,
        data: {
          periodAmount: '0x52b7d2dcc80cd2e4000000',
          periodDuration: 604800,
          tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
      } as const;

      const result = permissionTypeFromRpc(rpcPermission);

      expect(result).toStrictEqual({
        type: 'erc20-token-periodic',
        isAdjustmentAllowed: false,
        data: {
          periodAmount: 0x52b7d2dcc80cd2e4000000n,
          periodDuration: 604800,
          tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        },
      });
    });

    it('preserves erc20-token-revocation data (no hex amounts)', () => {
      const rpcPermission = {
        type: 'erc20-token-revocation',
        isAdjustmentAllowed: true,
        data: {
          justification: 'Revoking unused allowance',
        },
      } as const;

      const result = permissionTypeFromRpc(rpcPermission);

      expect(result).toStrictEqual({
        type: 'erc20-token-revocation',
        isAdjustmentAllowed: true,
        data: {
          justification: 'Revoking unused allowance',
        },
      });
    });
  });

  describe('permissionResponsesFromRpc', () => {
    it('converts array of RPC permission responses', () => {
      const rpcPermissions = [
        {
          ...basePermissionFields,
          permission: {
            type: 'native-token-stream',
            isAdjustmentAllowed: true,
            data: {
              amountPerSecond: '0x64',
              startTime: 1700000000,
            },
          },
        },
      ] as const;

      const result = permissionResponsesFromRpc([...rpcPermissions]);

      expect(result).to.have.length(1);
      expect(result[0]).toStrictEqual({
        chainId: 0x1,
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        from: '0x1234567890123456789012345678901234567890',
        context: '0x1234567890abcdef',
        dependencies: [],
        rules: [],
        delegationManager: '0x0987654321098765432109876543210987654321',
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: true,
          data: {
            amountPerSecond: 0x64n,
            startTime: 1700000000,
          },
        },
      });
    });

    it('checksum-normalizes redeemer rule addresses', () => {
      const rpcPermissions = [
        {
          ...basePermissionFields,
          rules: [
            {
              type: 'redeemer',
              data: {
                addresses: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
              },
            },
          ],
          permission: {
            type: 'native-token-stream',
            isAdjustmentAllowed: true,
            data: {
              amountPerSecond: '0x64',
              startTime: 1700000000,
            },
          },
        },
      ];

      const result = permissionResponsesFromRpc(
        rpcPermissions as RpcGetGrantedExecutionPermissionsResult,
      );

      expect(result[0]?.rules).toStrictEqual([
        {
          type: 'redeemer',
          data: {
            addresses: [
              getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
            ],
          },
        },
      ]);
    });
  });

  describe('rpcSupportedPermissionsToDeveloper', () => {
    it('converts chainIds hex → number for each permission type', () => {
      const rpcResult: RpcGetSupportedExecutionPermissionsResult = {
        'native-token-stream': {
          chainIds: ['0x1', '0x89'],
          ruleTypes: ['expiry'],
        },
        'erc20-token-stream': {
          chainIds: ['0x1'],
          ruleTypes: [],
        },
      };

      const result = rpcSupportedPermissionsToDeveloper(rpcResult);

      expect(result).toStrictEqual({
        'native-token-stream': {
          chainIds: [0x1, 0x89],
          ruleTypes: ['expiry'],
        },
        'erc20-token-stream': {
          chainIds: [0x1],
          ruleTypes: [],
        },
      });
    });

    it('returns empty object for empty input', () => {
      const result = rpcSupportedPermissionsToDeveloper({});

      expect(result).toStrictEqual({});
    });
  });

  describe('permissionRequestToRpc', () => {
    it('converts native-token-stream: bigint → hex, adds expiry rule', () => {
      const permissionRequest = {
        chainId: 31337,
        from: '0x1234567890123456789012345678901234567890',
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream',
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 0x2n,
            startTime: 2,
            justification: 'Test justification',
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result).toStrictEqual({
        chainId: '0x7a69',
        from: '0x1234567890123456789012345678901234567890',
        permission: {
          type: 'native-token-stream',
          data: {
            amountPerSecond: '0x1',
            maxAmount: '0x2',
            startTime: 2,
            justification: 'Test justification',
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: 1234567890,
            },
          },
        ],
      });
    });

    it('adds redeemer rule with checksummed addresses', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'native-token-stream',
          data: { amountPerSecond: 0x1n },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        redeemer: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result.rules).toStrictEqual([
        {
          type: 'redeemer',
          data: {
            addresses: [
              getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
            ],
          },
        },
      ]);
    });

    it('adds expiry then redeemer when both are set', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'native-token-stream',
          data: { amountPerSecond: 0x1n },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        expiry: 1234567890,
        redeemer: ['0x1111111111111111111111111111111111111111'],
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result.rules).toStrictEqual([
        {
          type: 'expiry',
          data: { timestamp: 1234567890 },
        },
        {
          type: 'redeemer',
          data: {
            addresses: [
              getAddress('0x1111111111111111111111111111111111111111'),
            ],
          },
        },
      ]);
    });

    it('throws when redeemer is empty', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'native-token-stream',
          data: { amountPerSecond: 0x1n },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        redeemer: [],
      } as const;

      expect(() => permissionRequestToRpc(permissionRequest)).toThrow(
        'Invalid redeemers: must specify at least one redeemer address',
      );
    });

    it('throws when redeemer contains invalid address', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'native-token-stream',
          data: { amountPerSecond: 0x1n },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        redeemer: ['0x1234'],
      } as const;

      expect(() => permissionRequestToRpc(permissionRequest)).toThrow(
        'Invalid redeemers: must be a valid address',
      );
    });

    it('converts native-token-periodic: bigint → hex', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'native-token-periodic',
          data: {
            periodAmount: 0x2386f26fc10000n,
            periodDuration: 86400,
            startTime: 1700000000,
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result).toStrictEqual({
        chainId: '0x1',
        permission: {
          type: 'native-token-periodic',
          data: {
            periodAmount: '0x2386f26fc10000',
            periodDuration: 86400,
            startTime: 1700000000,
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rules: [],
      });
    });

    it('converts erc20-token-stream: bigint → hex', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'erc20-token-stream',
          data: {
            amountPerSecond: 0xde0b6b3a7640000n,
            initialAmount: 0x1n,
            tokenAddress: '0x1234567890123456789012345678901234567890',
          },
          isAdjustmentAllowed: true,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result).toStrictEqual({
        chainId: '0x1',
        permission: {
          type: 'erc20-token-stream',
          data: {
            amountPerSecond: '0xde0b6b3a7640000',
            initialAmount: '0x1',
            tokenAddress: '0x1234567890123456789012345678901234567890',
          },
          isAdjustmentAllowed: true,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rules: [],
      });
    });

    it('converts erc20-token-periodic: bigint → hex', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'erc20-token-periodic',
          data: {
            periodAmount: 0x52b7d2dcc80cd2e4000000n,
            periodDuration: 604800,
            tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result).toStrictEqual({
        chainId: '0x1',
        permission: {
          type: 'erc20-token-periodic',
          data: {
            periodAmount: '0x52b7d2dcc80cd2e4000000',
            periodDuration: 604800,
            tokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rules: [],
      });
    });

    it('converts erc20-token-revocation: preserves justification', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'erc20-token-revocation',
          data: {
            justification: 'Revoke stale allowance',
          },
          isAdjustmentAllowed: true,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      const result = permissionRequestToRpc(permissionRequest);

      expect(result).toStrictEqual({
        chainId: '0x1',
        permission: {
          type: 'erc20-token-revocation',
          data: {
            justification: 'Revoke stale allowance',
          },
          isAdjustmentAllowed: true,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        rules: [],
      });
    });

    it('throws for unsupported permission type', () => {
      const permissionRequest = {
        chainId: 1,
        permission: {
          type: 'unsupported-type',
          data: {},
          isAdjustmentAllowed: false,
        },
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      } as const;

      expect(() => permissionRequestToRpc(permissionRequest as any)).toThrow(
        'Unsupported permission type: unsupported-type',
      );
    });
  });
});
