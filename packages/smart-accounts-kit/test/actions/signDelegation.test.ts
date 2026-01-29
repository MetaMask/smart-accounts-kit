import type { Account, Address } from 'viem';
import { createWalletClient, custom, isHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  signDelegation,
  signDelegationActions,
  type SignDelegationParameters,
} from '../../src/actions/signDelegation';
import { ROOT_AUTHORITY } from '../../src/delegation';
import type { Delegation } from '../../src/types';

const getLastSignCall = (mockFn: any) => {
  const { calls } = mockFn.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastCall = calls[calls.length - 1];
  expect(lastCall.length).toBeGreaterThan(0);
  return lastCall[0];
};

const randomAddress = (): Address => `0x${'1'.repeat(40)}`;

describe('signDelegation Action', () => {
  let mockWalletClient: ReturnType<typeof createWalletClient>;
  let account: Account;
  let delegation: Omit<Delegation, 'signature'>;
  let delegationManager: Address;
  const chainId = sepolia.id;

  const mockSignTypedData = vi.fn();
  const mockRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    account = privateKeyToAccount(generatePrivateKey());

    mockWalletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: custom({
        request: mockRequest,
      }),
    });

    // Mock the signTypedData method
    mockWalletClient.signTypedData = mockSignTypedData;

    delegation = {
      delegate: randomAddress(),
      delegator: randomAddress(),
      authority: ROOT_AUTHORITY as Address,
      caveats: [
        {
          enforcer: randomAddress(),
          terms: '0x',
          args: '0x00',
        },
      ],
      salt: '0x123',
    };

    delegationManager = randomAddress();

    mockSignTypedData.mockResolvedValue(`0x${'1'.repeat(130)}`);
  });

  describe('signDelegation function', () => {
    it('should sign a delegation using wallet client', async () => {
      const parameters: SignDelegationParameters = {
        delegation,
        delegationManager,
        chainId,
      };

      const signature = await signDelegation(mockWalletClient, parameters);

      // Validate signature format and cryptographic properties
      expect(isHex(signature)).toBe(true);
      expect(signature).toHaveLength(132); // 0x + 65 bytes * 2 hex chars
      expect(signature).toBe(`0x${'1'.repeat(130)}`); // Match mock return value
      expect(mockSignTypedData).toHaveBeenCalledOnce();

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall).toMatchObject({
        account,
        domain: {
          chainId,
          name: 'DelegationManager',
          version: '1',
          verifyingContract: delegationManager,
        },
        types: expect.any(Object),
        primaryType: 'Delegation',
        message: expect.objectContaining({
          delegate: delegation.delegate,
          delegator: delegation.delegator,
          authority: delegation.authority,
        }),
      });
    });

    it('should use custom name and version when provided', async () => {
      const parameters: SignDelegationParameters = {
        delegation,
        delegationManager,
        chainId,
        name: 'CustomDelegationManager',
        version: '2',
      };

      await signDelegation(mockWalletClient, parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain).toMatchObject({
        name: 'CustomDelegationManager',
        version: '2',
      });
    });

    it('should throw error when no account is provided', async () => {
      const clientWithoutAccount = createWalletClient({
        chain: sepolia,
        transport: custom({ request: mockRequest }),
      });
      clientWithoutAccount.signTypedData = mockSignTypedData;

      const parameters: SignDelegationParameters = {
        delegation,
        delegationManager,
        chainId,
      };

      await expect(
        signDelegation(clientWithoutAccount, parameters),
      ).rejects.toThrow('Account not found. Please provide an account.');
    });

    it('should throw error for delegation without caveats by default', async () => {
      const delegationWithoutCaveats = {
        ...delegation,
        caveats: [],
      };

      const parameters: SignDelegationParameters = {
        delegation: delegationWithoutCaveats,
        delegationManager,
        chainId,
      };

      await expect(
        signDelegation(mockWalletClient, parameters),
      ).rejects.toThrow(
        'No caveats found. If you definitely want to sign a delegation without caveats, set `allowInsecureUnrestrictedDelegation` to `true`.',
      );
    });

    it('should allow delegation without caveats when explicitly enabled', async () => {
      const delegationWithoutCaveats = {
        ...delegation,
        caveats: [],
      };

      const parameters: SignDelegationParameters = {
        delegation: delegationWithoutCaveats,
        delegationManager,
        chainId,
        allowInsecureUnrestrictedDelegation: true,
      };

      const signature = await signDelegation(mockWalletClient, parameters);
      expect(signature).toBe(`0x${'1'.repeat(130)}`);
    });

    it('should use account parameter when provided', async () => {
      const differentAccount = privateKeyToAccount(generatePrivateKey());

      const parameters: SignDelegationParameters = {
        account: differentAccount,
        delegation,
        delegationManager,
        chainId,
      };

      await signDelegation(mockWalletClient, parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.account).toBe(differentAccount);
    });
  });

  describe('signDelegationActions extension', () => {
    it('should create wallet client extension with signDelegation method', () => {
      const actions = signDelegationActions();
      const extension = actions(mockWalletClient);

      expect(extension).toHaveProperty('signDelegation');
      expect(typeof extension.signDelegation).toBe('function');
    });

    it('should sign delegation through extended client', async () => {
      const extendedClient = mockWalletClient.extend(signDelegationActions());

      const parameters = {
        delegation,
        delegationManager,
      };

      const signature = await extendedClient.signDelegation(parameters);

      expect(signature).toBe(`0x${'1'.repeat(130)}`);
      expect(mockSignTypedData).toHaveBeenCalledOnce();

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.chainId).toBe(sepolia.id); // Should use client's chain
    });

    it('should use provided chainId over client chainId', async () => {
      const extendedClient = mockWalletClient.extend(signDelegationActions());

      const customChainId = 999;
      const parameters = {
        delegation,
        delegationManager,
        chainId: customChainId,
      };

      await extendedClient.signDelegation(parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.chainId).toBe(customChainId);
    });

    it('should throw error when client has no chain and no chainId provided', async () => {
      const clientWithoutChain = createWalletClient({
        account,
        transport: custom({ request: mockRequest }),
      });
      clientWithoutChain.signTypedData = mockSignTypedData;

      const extendedClient = clientWithoutChain.extend(signDelegationActions());

      const parameters = {
        delegation,
        delegationManager,
      };

      await expect(extendedClient.signDelegation(parameters)).rejects.toThrow(
        'Chain ID is required. Either provide it in parameters or configure the client with a chain.',
      );
    });
  });

  describe('Integration: Direct function vs Extended client', () => {
    it('should produce identical results for same parameters', async () => {
      const extendedClient = mockWalletClient.extend(signDelegationActions());

      const directParams: SignDelegationParameters = {
        delegation,
        delegationManager,
        chainId,
      };

      const extensionParams = {
        delegation,
        delegationManager,
        chainId,
      };

      // Reset mock between calls
      mockSignTypedData.mockClear();
      const directResult = await signDelegation(mockWalletClient, directParams);

      const directCallArgs = getLastSignCall(mockSignTypedData);

      mockSignTypedData.mockClear();
      const extensionResult =
        await extendedClient.signDelegation(extensionParams);

      const extensionCallArgs = getLastSignCall(mockSignTypedData);

      // Both should return the same signature
      expect(directResult).toBe(extensionResult);

      // Both should call signTypedData with identical parameters
      expect(directCallArgs).toEqual(extensionCallArgs);
    });
  });
});
