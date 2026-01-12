import type {
  AccountSigner,
  NativeTokenStreamPermission,
  PermissionResponse,
} from '@metamask/7715-permission-types';
import { stub } from 'sinon';
import type { Client } from 'viem';
import { createClient, custom } from 'viem';
import { beforeEach, describe, expect, it } from 'vitest';

import { erc7715ProviderActions } from '../../src/actions';
import {
  erc7715GetGrantedExecutionPermissionsAction,
  type GetGrantedExecutionPermissionsResult,
} from '../../src/actions/erc7715GetGrantedExecutionPermissionsAction';

describe('erc7715GetGrantedExecutionPermissionsAction', () => {
  const stubRequest = stub();
  const mockClient: Client = {
    request: stubRequest,
  } as unknown as Client;

  const mockPermission: PermissionResponse<
    AccountSigner,
    NativeTokenStreamPermission
  > = {
    chainId: '0x1',
    address: '0x1234567890123456789012345678901234567890',
    signer: {
      type: 'account',
      data: {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      },
    },
    permission: {
      type: 'native-token-stream',
      isAdjustmentAllowed: true,
      data: {
        amountPerSecond: '0x1',
        maxAmount: '0x100',
        startTime: 1234567890,
      },
    },
    context: '0x1234567890abcdef',
    dependencyInfo: [],
    rules: [
      {
        type: 'expiry',
        isAdjustmentAllowed: true,
        data: {
          timestamp: 1234567890,
        },
      },
    ],
    signerMeta: {
      delegationManager: '0x0987654321098765432109876543210987654321',
    },
  };

  const mockResponse: GetGrantedExecutionPermissionsResult = [mockPermission];

  beforeEach(() => {
    stubRequest.reset();
  });

  describe('erc7715GetGrantedExecutionPermissionsAction()', () => {
    it('calls the wallet RPC method with empty params', async () => {
      stubRequest.resolves(mockResponse);

      const result =
        await erc7715GetGrantedExecutionPermissionsAction(mockClient);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_getGrantedExecutionPermissions',
        params: [],
      });
      expect(result).to.deep.equal(mockResponse);
    });

    it('should set retryCount to 0', async () => {
      stubRequest.resolves(mockResponse);

      await erc7715GetGrantedExecutionPermissionsAction(mockClient);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[1]).to.deep.equal({
        retryCount: 0,
      });
    });

    it('should throw an error when result is null', async () => {
      stubRequest.resolves(null);

      await expect(
        erc7715GetGrantedExecutionPermissionsAction(mockClient),
      ).rejects.toThrow('Failed to get granted execution permissions');
    });

    it('should throw an error when result is undefined', async () => {
      stubRequest.resolves(undefined);

      await expect(
        erc7715GetGrantedExecutionPermissionsAction(mockClient),
      ).rejects.toThrow('Failed to get granted execution permissions');
    });

    it('should return empty array when no permissions are granted', async () => {
      const emptyResponse: GetGrantedExecutionPermissionsResult = [];
      stubRequest.resolves(emptyResponse);

      const result =
        await erc7715GetGrantedExecutionPermissionsAction(mockClient);

      expect(result).to.deep.equal(emptyResponse);
    });

    it('should handle response with multiple granted permissions', async () => {
      const secondPermission: PermissionResponse<
        AccountSigner,
        NativeTokenStreamPermission
      > = {
        chainId: '0x89',
        address: '0x2234567890123456789012345678901234567890',
        signer: {
          type: 'account',
          data: {
            address: '0xbbcdefabcdefabcdefabcdefabcdefabcdefabcd',
          },
        },
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: false,
          data: {
            amountPerSecond: '0x2',
          },
        },
        context: '0xabcdef1234567890',
        dependencyInfo: [
          {
            factory: '0x1111111111111111111111111111111111111111',
            factoryData: '0xfactorydata',
          },
        ],
        rules: [],
      };

      const multiplePermissions: GetGrantedExecutionPermissionsResult = [
        mockPermission,
        secondPermission,
      ];
      stubRequest.resolves(multiplePermissions);

      const result =
        await erc7715GetGrantedExecutionPermissionsAction(mockClient);

      expect(result).to.deep.equal(multiplePermissions);
      expect(result).to.have.length(2);
    });
  });

  describe('erc7715ProviderActions integration', () => {
    it('should extend the client with getGrantedExecutionPermissions action', async () => {
      const client = createClient({
        transport: custom({
          request: stubRequest,
        }),
      }).extend(erc7715ProviderActions());

      expect(client).to.have.property('getGrantedExecutionPermissions');

      stubRequest.resolves(mockResponse);

      await client.getGrantedExecutionPermissions();

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_getGrantedExecutionPermissions',
        params: [],
      });
    });
  });
});
