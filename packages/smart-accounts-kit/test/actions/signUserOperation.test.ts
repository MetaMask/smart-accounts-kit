import type { Account, Address, Hex } from 'viem';
import { createWalletClient, custom, isHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  signUserOperation,
  signUserOperationActions,
} from '../../src/actions/signUserOperation';
import type { SignUserOperationParameters } from '../../src/actions/signUserOperation';
import type { UserOperationV07 } from '../../src/userOp';

const getLastSignCall = (mockFn: any) => {
  const { calls } = mockFn.mock;
  expect(calls.length).toBeGreaterThan(0);
  const lastCall = calls[calls.length - 1];
  expect(lastCall.length).toBeGreaterThan(0);
  return lastCall[0];
};

const randomAddress = (): Address => `0x${'1'.repeat(40)}`;

describe('signUserOperation Action', () => {
  let mockWalletClient: ReturnType<typeof createWalletClient>;
  let account: Account;
  let userOperation: Omit<UserOperationV07, 'signature'>;
  let entryPoint: { address: Address };
  let smartAccountAddress: Address;
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

    userOperation = {
      sender: randomAddress(),
      nonce: 0n,
      callData: '0x' as Hex,
      callGasLimit: 1000000n,
      verificationGasLimit: 1000000n,
      preVerificationGas: 21000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 1000000000n,
    };

    entryPoint = { address: randomAddress() };
    smartAccountAddress = randomAddress();

    mockSignTypedData.mockResolvedValue(`0x${'2'.repeat(130)}`);
  });

  describe('signUserOperation function', () => {
    it('should sign a user operation using wallet client', async () => {
      const parameters: SignUserOperationParameters = {
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      const signature = await signUserOperation(mockWalletClient, parameters);

      // Validate signature format and cryptographic properties
      expect(isHex(signature)).toBe(true);
      expect(signature).toHaveLength(132); // 0x + 65 bytes * 2 hex chars
      expect(signature).toBe(`0x${'2'.repeat(130)}`); // Match mock return value
      expect(mockSignTypedData).toHaveBeenCalledOnce();

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall).toMatchObject({
        account,
        domain: {
          chainId,
          name: 'HybridDeleGator',
          version: '1',
          verifyingContract: smartAccountAddress,
        },
        types: expect.any(Object),
        primaryType: 'PackedUserOperation',
        message: expect.objectContaining({
          sender: userOperation.sender,
          nonce: userOperation.nonce,
          entryPoint: entryPoint.address,
        }),
      });
    });

    it('should work with MultiSigDeleGator name', async () => {
      const parameters: SignUserOperationParameters = {
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'MultiSigDeleGator',
      };

      await signUserOperation(mockWalletClient, parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.name).toBe('MultiSigDeleGator');
    });

    it('should use custom version when provided', async () => {
      const parameters: SignUserOperationParameters = {
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
        version: '2',
      };

      await signUserOperation(mockWalletClient, parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.version).toBe('2');
    });

    it('should throw error when no account is provided', async () => {
      const clientWithoutAccount = createWalletClient({
        chain: sepolia,
        transport: custom({ request: mockRequest }),
      });
      clientWithoutAccount.signTypedData = mockSignTypedData;

      const parameters: SignUserOperationParameters = {
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      await expect(
        signUserOperation(clientWithoutAccount, parameters),
      ).rejects.toThrow('Account not found. Please provide an account.');
    });

    it('should use account parameter when provided', async () => {
      const differentAccount = privateKeyToAccount(generatePrivateKey());

      const parameters: SignUserOperationParameters = {
        account: differentAccount,
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      await signUserOperation(mockWalletClient, parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.account).toBe(differentAccount);
    });

    it('should handle user operation with paymaster data', async () => {
      const userOpWithPaymaster = {
        ...userOperation,
        paymaster: randomAddress(),
        paymasterVerificationGasLimit: 50000n,
        paymasterPostOpGasLimit: 50000n,
        paymasterData: '0x1234' as Hex,
      };

      const parameters: SignUserOperationParameters = {
        userOperation: userOpWithPaymaster,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      const signature = await signUserOperation(mockWalletClient, parameters);
      expect(signature).toBe(`0x${'2'.repeat(130)}`);
    });

    it('should handle user operation with factory data', async () => {
      const userOpWithFactory = {
        ...userOperation,
        factory: randomAddress(),
        factoryData: '0x5678' as Hex,
      };

      const parameters: SignUserOperationParameters = {
        userOperation: userOpWithFactory,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      const signature = await signUserOperation(mockWalletClient, parameters);
      expect(signature).toBe(`0x${'2'.repeat(130)}`);
    });
  });

  describe('signUserOperationActions extension', () => {
    it('should create wallet client extension with signUserOperation method', () => {
      const actions = signUserOperationActions();
      const extension = actions(mockWalletClient);

      expect(extension).toHaveProperty('signUserOperation');
      expect(typeof extension.signUserOperation).toBe('function');
    });

    it('should sign user operation through extended client', async () => {
      const extendedClient = mockWalletClient.extend(
        signUserOperationActions(),
      );

      const parameters = {
        userOperation,
        entryPoint,
        address: smartAccountAddress,
        name: 'HybridDeleGator' as const,
      };

      const signature = await extendedClient.signUserOperation(parameters);

      expect(signature).toBe(`0x${'2'.repeat(130)}`);
      expect(mockSignTypedData).toHaveBeenCalledOnce();

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.chainId).toBe(sepolia.id); // Should use client's chain
    });

    it('should use provided chainId over client chainId', async () => {
      const extendedClient = mockWalletClient.extend(
        signUserOperationActions(),
      );

      const customChainId = 999;
      const parameters = {
        userOperation,
        entryPoint,
        address: smartAccountAddress,
        name: 'HybridDeleGator' as const,
        chainId: customChainId,
      };

      await extendedClient.signUserOperation(parameters);

      const signCall = getLastSignCall(mockSignTypedData);
      expect(signCall.domain.chainId).toBe(customChainId);
    });

    it('should throw error when client has no chain and no chainId provided', async () => {
      const clientWithoutChain = createWalletClient({
        account,
        transport: custom({ request: mockRequest }),
      });
      clientWithoutChain.signTypedData = mockSignTypedData;

      const extendedClient = clientWithoutChain.extend(
        signUserOperationActions(),
      );

      const parameters = {
        userOperation,
        entryPoint,
        address: smartAccountAddress,
        name: 'HybridDeleGator' as const,
      };

      await expect(
        extendedClient.signUserOperation(parameters),
      ).rejects.toThrow(
        'Chain ID is required. Either provide it in parameters or configure the client with a chain.',
      );
    });
  });

  describe('Integration: Direct function vs Extended client', () => {
    it('should produce identical results for same parameters', async () => {
      const extendedClient = mockWalletClient.extend(
        signUserOperationActions(),
      );

      const directParams: SignUserOperationParameters = {
        userOperation,
        entryPoint,
        chainId,
        address: smartAccountAddress,
        name: 'HybridDeleGator',
      };

      const extensionParams = {
        userOperation,
        entryPoint,
        address: smartAccountAddress,
        name: 'HybridDeleGator' as const,
        chainId,
      };

      // Reset mock between calls
      mockSignTypedData.mockClear();
      const directResult = await signUserOperation(
        mockWalletClient,
        directParams,
      );

      const directCallArgs = getLastSignCall(mockSignTypedData);

      mockSignTypedData.mockClear();
      const extensionResult =
        await extendedClient.signUserOperation(extensionParams);

      const extensionCallArgs = getLastSignCall(mockSignTypedData);

      // Both should return the same signature
      expect(directResult).toBe(extensionResult);

      // Both should call signTypedData with identical parameters
      expect(directCallArgs).toEqual(extensionCallArgs);
    });
  });
});
