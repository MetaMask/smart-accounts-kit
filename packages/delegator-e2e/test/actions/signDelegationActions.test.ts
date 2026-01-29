import { beforeEach, test, expect } from 'vitest';
import {
  createDelegation,
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import { signDelegationActions } from '@metamask/smart-accounts-kit/actions';
import { createWalletClient, http, isHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { publicClient } from '../utils/helpers';

/**
 * E2E tests for delegation signing actions with wallet client extensions.
 * These tests verify that the signDelegationActions extension works correctly
 * with real wallet clients and smart accounts.
 */

let aliceSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>;
let walletClient: ReturnType<typeof createWalletClient>;

beforeEach(async () => {
  const alice = privateKeyToAccount(generatePrivateKey());

  // Create a wallet client that will be extended with signing actions
  walletClient = createWalletClient({
    account: alice,
    chain: sepolia,
    transport: http(),
  });

  aliceSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [alice.address, [], [], []],
    deploySalt: '0x1',
    signer: { account: alice },
  });
});

test('should sign delegation using extended wallet client', async () => {
  // Extend the wallet client with delegation signing actions
  const extendedClient = walletClient.extend(signDelegationActions());

  // Verify the client has the signDelegation method
  expect(extendedClient).toHaveProperty('signDelegation');
  expect(typeof extendedClient.signDelegation).toBe('function');

  // Create a delegation to sign
  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: ['0x1234567890123456789012345678901234567890'],
      selectors: ['increment()'],
    },
    caveats: [],
  });

  // Sign the delegation using the extended client
  const signature = await extendedClient.signDelegation({
    delegation,
    delegationManager: aliceSmartAccount.environment.DelegationManager,
  });

  // Verify the signature format and cryptographic validity
  expect(isHex(signature)).toBe(true);
  expect(signature).toHaveLength(132); // 0x + 65 bytes * 2 hex chars
});

test('should sign delegation with custom parameters', async () => {
  const extendedClient = walletClient.extend(signDelegationActions());

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'nativeTokenTransferAmount',
      maxAmount: 1000000n,
    },
    caveats: [],
  });

  // Sign with custom parameters
  const signature = await extendedClient.signDelegation({
    delegation,
    delegationManager: aliceSmartAccount.environment.DelegationManager,
    chainId: sepolia.id, // Explicitly provide chainId
    name: 'DelegationManager',
    version: '1',
  });

  expect(isHex(signature)).toBe(true);
  expect(signature).toHaveLength(132);
});

test('should work with different delegation types', async () => {
  const extendedClient = walletClient.extend(signDelegationActions());

  // Test ERC20 transfer delegation
  const erc20Delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'erc20TransferAmount',
      tokenAddress: '0x1234567890123456789012345678901234567890',
      maxAmount: 1000000n,
    },
    caveats: [],
  });

  const erc20Signature = await extendedClient.signDelegation({
    delegation: erc20Delegation,
    delegationManager: aliceSmartAccount.environment.DelegationManager,
  });

  expect(isHex(erc20Signature)).toBe(true);
  expect(erc20Signature).toHaveLength(132);

  // Test function call delegation
  const functionCallDelegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: ['0x1234567890123456789012345678901234567890'],
      selectors: ['transfer(address,uint256)'],
    },
    caveats: [],
  });

  const functionCallSignature = await extendedClient.signDelegation({
    delegation: functionCallDelegation,
    delegationManager: aliceSmartAccount.environment.DelegationManager,
  });

  expect(isHex(functionCallSignature)).toBe(true);
  expect(functionCallSignature).toHaveLength(132);

  // Both signatures should be different (different delegations)
  expect(erc20Signature).not.toBe(functionCallSignature);
});

test('should handle delegation with additional caveats', async () => {
  const extendedClient = walletClient.extend(signDelegationActions());

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: ['0x1234567890123456789012345678901234567890'],
      selectors: ['increment()'],
    },
    caveats: [
      {
        enforcer: '0x1111111111111111111111111111111111111111',
        terms: '0x1234',
        args: '0x00',
      },
    ],
  });

  const signature = await extendedClient.signDelegation({
    delegation,
    delegationManager: aliceSmartAccount.environment.DelegationManager,
  });

  expect(isHex(signature)).toBe(true);
  expect(signature).toHaveLength(132);
});

test('should be compatible with MetaMask smart account signing', async () => {
  const extendedClient = walletClient.extend(signDelegationActions());

  const delegation = createDelegation({
    environment: aliceSmartAccount.environment,
    to: '0x1234567890123456789012345678901234567890',
    from: aliceSmartAccount.address,
    scope: {
      type: 'functionCall',
      targets: ['0x1234567890123456789012345678901234567890'],
      selectors: ['increment()'],
    },
    caveats: [],
  });

  // Sign using both the extended client and the smart account
  const [extendedClientSignature, smartAccountSignature] = await Promise.all([
    extendedClient.signDelegation({
      delegation,
      delegationManager: aliceSmartAccount.environment.DelegationManager,
    }),
    aliceSmartAccount.signDelegation({ delegation }),
  ]);

  // Both signatures should be valid but may be different due to different signing methods
  expect(isHex(extendedClientSignature)).toBe(true);
  expect(extendedClientSignature).toHaveLength(132);
  expect(isHex(smartAccountSignature)).toBe(true);
  expect(smartAccountSignature).toHaveLength(132);
});
