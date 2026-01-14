import type {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  Erc20TokenRevocationPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionRequest,
} from '@metamask/7715-permission-types';
import { stub } from 'sinon';
import type { Account, Client } from 'viem';
import { createClient, custom } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { beforeEach, describe, expect, it } from 'vitest';

import { erc7715ProviderActions } from '../../src/actions';
import type { RequestExecutionPermissionsParameters } from '../../src/actions/erc7715RequestExecutionPermissionsAction';
import { erc7715RequestExecutionPermissionsAction } from '../../src/actions/erc7715RequestExecutionPermissionsAction';

describe('erc7715RequestExecutionPermissionsAction', () => {
  let alice: Account;
  let bob: Account;

  const stubRequest = stub();
  const mockClient: Client = {
    request: stubRequest,
  } as unknown as Client;

  // the response object is passed verbatim back to the caller, so the actual data doesn't matter
  const mockResponse = [
    {
      success: true,
    },
  ];

  beforeEach(async () => {
    alice = privateKeyToAccount(generatePrivateKey());
    bob = privateKeyToAccount(generatePrivateKey());

    stubRequest.reset();
  });

  describe('erc7715RequestExecutionPermissionsAction()', () => {
    it('calls the wallet RPC method', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];

      stubRequest.resolves(mockResponse);

      const result = await erc7715RequestExecutionPermissionsAction(
        mockClient,
        parameters,
      );
      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
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
            rules: [
              {
                data: {
                  timestamp: 1234567890,
                },
                type: 'expiry',
              },
            ],
            to: alice.address,
          },
        ],
      });
      expect(result).to.deep.equal(mockResponse);
    });

    it('should set retryCount to 0', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };

      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];
      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[1]).to.deep.equal({
        retryCount: 0,
      });
    });

    it('should throw an error when amountPerSecond is undefined', async () => {
      const parameters = [
        {
          chainId: 31337,
          from: bob.address,
          expiry: 1234567890,
          permission: {
            type: 'native-token-stream' as const,
            data: {
              amountPerSecond: undefined as any,
              maxAmount: 2n,
              startTime: 2,
              justification: 'Test justification',
            },
          },
          isAdjustmentAllowed: false,
          to: alice.address,
        },
      ];

      await expect(
        erc7715RequestExecutionPermissionsAction(mockClient, parameters),
      ).rejects.toThrow('Invalid parameters: amountPerSecond is required');
    });

    it("doesn't throw error when justification is undefined", async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: undefined as any,
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];

      stubRequest.resolves(mockResponse);

      await expect(
        erc7715RequestExecutionPermissionsAction(mockClient, parameters),
      ).resolves.not.toThrow();
    });

    it('should format native-token-stream permission request correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };

      const parameters = [permissionRequest];
      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
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
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });

    it('should throw an error when result is null', async () => {
      stubRequest.resolves(null);

      const parameters = [
        {
          chainId: 31337,
          expiry: Math.floor(Date.now() / 1000) + 3600,
          permission: {
            type: 'native-token-stream' as const,
            data: {
              amountPerSecond: 0x1n,
              maxAmount: 2n,
              startTime: 1,
              justification: 'Test justification',
            },
          },
          isAdjustmentAllowed: false,
          to: alice.address,
        },
      ];

      await expect(
        erc7715RequestExecutionPermissionsAction(mockClient, parameters),
      ).rejects.toThrow('Failed to grant permissions');
    });

    it('should handle multiple permission requests', async () => {
      stubRequest.resolves(mockResponse);

      const parameters: RequestExecutionPermissionsParameters = [
        {
          chainId: 31337,
          expiry: 1234567890,
          permission: {
            type: 'native-token-stream' as const,
            data: {
              amountPerSecond: 0x1n,
              justification: 'Test justification',
            },
          },
          isAdjustmentAllowed: false,
          to: alice.address,
        },
        {
          chainId: 31337,
          expiry: 1234567890,
          permission: {
            type: 'native-token-stream' as const,
            data: {
              amountPerSecond: 0x1n,
              justification: 'Test justification',
            },
          },
          isAdjustmentAllowed: false,
          to: bob.address,
        },
      ];

      const result = await erc7715RequestExecutionPermissionsAction(
        mockClient,
        parameters,
      );

      expect(result).to.deep.equal(mockResponse);
    });

    it('should not specify isAdjustmentAllowed when not specified in the request', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      stubRequest.resolves(mockResponse);
      await erc7715RequestExecutionPermissionsAction(mockClient, [
        permissionRequest,
      ]);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
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
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });

    it('should allow maxAmount to be excluded from the request', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      stubRequest.resolves(mockResponse);
      await (erc7715RequestExecutionPermissionsAction as any)(mockClient, [
        permissionRequest,
      ] as any);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
            permission: {
              type: 'native-token-stream',
              data: {
                amountPerSecond: '0x1',
                startTime: 2,
                justification: 'Test justification',
              },
              isAdjustmentAllowed: false,
            },
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });

    it('should allow maxAmount to be null in the request', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: null as any,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      const parameters = [permissionRequest];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
            permission: {
              type: 'native-token-stream',
              data: {
                amountPerSecond: '0x1',
                startTime: 2,
                justification: 'Test justification',
              },
              isAdjustmentAllowed: false,
            },
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });

    it('should accept numerical values as hex for startTime', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      const parameters = [permissionRequest];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
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
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });

    it('formats Native Token Stream correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream',
          data: {
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: true,
        to: alice.address,
      } as const;
      stubRequest.resolves(mockResponse);

      await (erc7715RequestExecutionPermissionsAction as any)(mockClient, [
        permissionRequest,
      ]);

      const expectedRequest: PermissionRequest<NativeTokenStreamPermission> = {
        chainId: '0x7a69',
        from: bob.address,
        permission: {
          type: 'native-token-stream',
          data: {
            amountPerSecond: '0x1',
            maxAmount: '0x2',
            startTime: 2,
            justification: 'Test justification',
          },
          isAdjustmentAllowed: true,
        },
        to: alice.address,
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: 1234567890,
            },
          },
        ],
      };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });

    it('formats Erc20 Token Revocation correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'erc20-token-revocation' as const,
          data: {
            justification: 'Revoke stale allowance',
          },
        },
        isAdjustmentAllowed: true,
        to: alice.address,
      } as const;
      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];
      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      const expectedRequest: PermissionRequest<Erc20TokenRevocationPermission> =
        {
          chainId: '0x7a69',
          from: bob.address,
          permission: {
            type: 'erc20-token-revocation',
            data: {
              justification: 'Revoke stale allowance',
            },
            isAdjustmentAllowed: true,
          },
          to: alice.address,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: 1234567890,
              },
            },
          ],
        };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });

    it("doesn't include justification when omitted for Erc20 Token Revocation", async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'erc20-token-revocation' as const,
          data: {},
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };
      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      const expectedRequest: PermissionRequest<Erc20TokenRevocationPermission> =
        {
          chainId: '0x7a69',
          from: bob.address,
          permission: {
            type: 'erc20-token-revocation',
            data: {},
            isAdjustmentAllowed: false,
          },
          to: alice.address,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: 1234567890,
              },
            },
          ],
        };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });

    it('formats Erc20 Token Stream correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'erc20-token-stream',
          data: {
            tokenAddress: '0x1',
            amountPerSecond: 0x1n,
            maxAmount: 2n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: true,
        to: alice.address,
      } as const;
      const parameters = [permissionRequest];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      const expectedRequest: PermissionRequest<Erc20TokenStreamPermission> = {
        chainId: '0x7a69',
        from: bob.address,
        permission: {
          type: 'erc20-token-stream',
          data: {
            tokenAddress: '0x1',
            amountPerSecond: '0x1',
            maxAmount: '0x2',
            startTime: 2,
            justification: 'Test justification',
          },
          isAdjustmentAllowed: true,
        },
        to: alice.address,
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: 1234567890,
            },
          },
        ],
      };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });

    it('formats Native Token Periodic correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-periodic' as const,
          data: {
            periodAmount: 0x5n,
            periodDuration: 60,
            startTime: 1000,
            justification: 'Periodic native token test',
          },
        },
        isAdjustmentAllowed: true,
        to: alice.address,
      };
      const parameters = [permissionRequest];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      const expectedRequest: PermissionRequest<NativeTokenPeriodicPermission> =
        {
          chainId: '0x7a69',
          from: bob.address,
          permission: {
            type: 'native-token-periodic',
            data: {
              periodAmount: '0x5',
              periodDuration: 60,
              startTime: 1000,
              justification: 'Periodic native token test',
            },
            isAdjustmentAllowed: true,
          },
          to: alice.address,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: 1234567890,
              },
            },
          ],
        };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });

    it('formats Erc20 Token Periodic correctly', async () => {
      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'erc20-token-periodic' as const,
          data: {
            tokenAddress: '0x2',
            periodAmount: 0x10n,
            periodDuration: 120,
            startTime: 2000,
            justification: 'Periodic erc20 token test',
          },
        },
        isAdjustmentAllowed: true,
        to: alice.address,
      } as const;
      const parameters = [permissionRequest];

      stubRequest.resolves(mockResponse);

      await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

      const expectedRequest: PermissionRequest<Erc20TokenPeriodicPermission> = {
        chainId: '0x7a69',
        from: bob.address,
        permission: {
          type: 'erc20-token-periodic',
          data: {
            tokenAddress: '0x2',
            periodAmount: '0x10',
            periodDuration: 120,
            startTime: 2000,
            justification: 'Periodic erc20 token test',
          },
          isAdjustmentAllowed: true,
        },
        to: alice.address,
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: 1234567890,
            },
          },
        ],
      };

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [expectedRequest],
      });
    });
  });

  it('omits expiry rule when expiry is not provided', async () => {
    const permissionRequest = {
      chainId: 31337,
      from: bob.address,
      // expiry is intentionally omitted
      permission: {
        type: 'native-token-stream' as const,
        data: {
          amountPerSecond: 0x1n,
          maxAmount: 2n,
          startTime: 2,
          justification: 'Test justification',
        },
      },
      isAdjustmentAllowed: false,
      to: alice.address,
    };
    const parameters: RequestExecutionPermissionsParameters = [
      permissionRequest,
    ];

    stubRequest.resolves(mockResponse);

    await erc7715RequestExecutionPermissionsAction(mockClient, parameters);

    expect(stubRequest.callCount).to.equal(1);
    expect(stubRequest.firstCall.args[0]).to.deep.equal({
      method: 'wallet_requestExecutionPermissions',
      params: [
        {
          chainId: '0x7a69',
          from: bob.address,
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
          to: alice.address,
          rules: [],
        },
      ],
    });
  });
  describe('erc7715ProviderActions integration', () => {
    it('should extend the client with erc7715 actions', async () => {
      const client = createClient({
        transport: custom({
          request: stubRequest,
        }),
      }).extend(erc7715ProviderActions());

      expect(client).to.have.property('requestExecutionPermissions');

      const permissionRequest = {
        chainId: 31337,
        from: bob.address,
        expiry: 1234567890,
        permission: {
          type: 'native-token-stream' as const,
          data: {
            amountPerSecond: 0x1n,
            startTime: 2,
            justification: 'Test justification',
          },
        },
        isAdjustmentAllowed: false,
        to: alice.address,
      };

      stubRequest.resolves(mockResponse);

      const parameters: RequestExecutionPermissionsParameters = [
        permissionRequest,
      ];
      await client.requestExecutionPermissions(parameters);

      expect(stubRequest.callCount).to.equal(1);
      expect(stubRequest.firstCall.args[0]).to.deep.equal({
        method: 'wallet_requestExecutionPermissions',
        params: [
          {
            chainId: '0x7a69',
            from: bob.address,
            permission: {
              type: 'native-token-stream',
              data: {
                amountPerSecond: '0x1',
                startTime: 2,
                justification: 'Test justification',
              },
              isAdjustmentAllowed: false,
            },
            to: alice.address,
            rules: [
              {
                type: 'expiry',
                data: {
                  timestamp: 1234567890,
                },
              },
            ],
          },
        ],
      });
    });
  });
});
