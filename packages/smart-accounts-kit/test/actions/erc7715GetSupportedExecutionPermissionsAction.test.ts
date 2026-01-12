import { stub } from 'sinon';
import type { Client } from 'viem';
import { createClient, custom } from 'viem';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  erc7715ProviderActions,
  type GetSupportedExecutionPermissionsResult,
} from '../../src/actions';
import { erc7715GetSupportedExecutionPermissionsAction } from '../../src/actions/erc7715GetSupportedExecutionPermissionsAction';

describe('erc7715GetSupportedExecutionPermissionsAction', () => {
  const stubRequest = stub();
  const mockClient: Client = {
    request: stubRequest,
  } as unknown as Client;

  const mockResponse: GetSupportedExecutionPermissionsResult = {
    'native-token-allowance': {
      chainIds: ['0x1', '0x89'],
      ruleTypes: ['expiry'],
    },
    'erc20-token-allowance': {
      chainIds: ['0x1'],
      ruleTypes: [],
    },
    'erc721-token-allowance': {
      chainIds: ['0x1'],
      ruleTypes: ['expiry'],
    },
  };

  beforeEach(() => {
    stubRequest.reset();
  });

  describe('erc7715GetSupportedExecutionPermissionsAction()', () => {
    it('calls the wallet RPC method with empty params', async () => {
      stubRequest.resolves(mockResponse);

      const result =
        await erc7715GetSupportedExecutionPermissionsAction(mockClient);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_getSupportedExecutionPermissions',
        params: [],
      });
      expect(result).to.deep.equal(mockResponse);
    });

    it('should set retryCount to 0', async () => {
      stubRequest.resolves(mockResponse);

      await erc7715GetSupportedExecutionPermissionsAction(mockClient);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[1]).to.deep.equal({
        retryCount: 0,
      });
    });

    it('should throw an error when result is null', async () => {
      stubRequest.resolves(null);

      await expect(
        erc7715GetSupportedExecutionPermissionsAction(mockClient),
      ).rejects.toThrow('Failed to get supported execution permissions');
    });

    it('should throw an error when result is undefined', async () => {
      stubRequest.resolves(undefined);

      await expect(
        erc7715GetSupportedExecutionPermissionsAction(mockClient),
      ).rejects.toThrow('Failed to get supported execution permissions');
    });

    it('should return empty object when wallet supports no permissions', async () => {
      const emptyResponse: GetSupportedExecutionPermissionsResult = {};
      stubRequest.resolves(emptyResponse);

      const result =
        await erc7715GetSupportedExecutionPermissionsAction(mockClient);

      expect(result).to.deep.equal(emptyResponse);
    });

    it('should handle response with multiple chain IDs', async () => {
      const multiChainResponse: GetSupportedExecutionPermissionsResult = {
        'native-token-stream': {
          chainIds: ['0x1', '0x89', '0xa4b1', '0x2105'],
          ruleTypes: ['expiry', 'usage-limit'],
        },
      };
      stubRequest.resolves(multiChainResponse);

      const result =
        await erc7715GetSupportedExecutionPermissionsAction(mockClient);

      expect(result).to.deep.equal(multiChainResponse);
    });
  });

  describe('erc7715ProviderActions integration', () => {
    it('should extend the client with getSupportedExecutionPermissions action', async () => {
      const client = createClient({
        transport: custom({
          request: stubRequest,
        }),
      }).extend(erc7715ProviderActions());

      expect(client).to.have.property('getSupportedExecutionPermissions');

      stubRequest.resolves(mockResponse);

      await client.getSupportedExecutionPermissions();

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_getSupportedExecutionPermissions',
        params: [],
      });
    });
  });
});
