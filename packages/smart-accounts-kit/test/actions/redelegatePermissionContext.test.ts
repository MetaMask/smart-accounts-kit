import { createWalletClient, http, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  redelegatePermissionContext,
  redelegatePermissionContextActions,
} from '../../src/actions/redelegatePermissionContext';
import { ScopeType } from '../../src/constants';
import { createDelegation, encodeDelegations } from '../../src/delegation';
import type { SmartAccountsEnvironment } from '../../src/types';

const mockPrivateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;
const account = privateKeyToAccount(mockPrivateKey);

const mockEnvironment: SmartAccountsEnvironment = {
  DelegationManager: '0x1234567890123456789012345678901234567890',
  EntryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  SimpleFactory: '0x9876543210987654321098765432109876543210',
  implementations: {},
  caveatEnforcers: {
    ValueLteEnforcer: '0x1111111111111111111111111111111111111111',
    ERC20TransferAmountEnforcer: '0x2222222222222222222222222222222222222222',
    AllowedTargets: '0x3333333333333333333333333333333333333333',
    AllowedMethods: '0x4444444444444444444444444444444444444444',
    TimestampEnforcer: '0x5555555555555555555555555555555555555555',
    ExactCalldataEnforcer: '0x6666666666666666666666666666666666666666',
    NativeTokenTransferAmountEnforcer:
      '0x7777777777777777777777777777777777777777',
  },
};

const mockDelegationManager: Address =
  '0x1234567890123456789012345678901234567890';
const mockChainId = sepolia.id;

describe('redelegatePermissionContext', () => {
  let client: ReturnType<typeof createWalletClient>;

  beforeEach(() => {
    client = createWalletClient({
      account,
      chain: sepolia,
      transport: http('https://rpc.sepolia.org'),
    });
  });

  it('should create a redelegation with a specific delegate', async () => {
    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await redelegatePermissionContext(client, {
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      delegate: newDelegate,
      caveats: [timestampCaveat],
    });

    expect(result.delegation.delegate).to.equal(newDelegate);
    expect(result.delegation.delegator).to.equal(account.address);
    expect(result.delegation.signature).to.match(/^0x[a-fA-F0-9]+$/u);
    expect(result.permissionContext).to.match(/^0x[a-fA-F0-9]+$/u);

    // Verify the permission context is valid and longer than the original
    expect(result.permissionContext.length).to.be.greaterThan(
      permissionContext.length,
    );
  });

  it('should create an open redelegation when no delegate is specified', async () => {
    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 500n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await redelegatePermissionContext(client, {
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      // No delegate specified
      caveats: [timestampCaveat],
    });

    expect(result.delegation.delegate).to.equal(
      '0x0000000000000000000000000000000000000a11', // ANY_BENEFICIARY
    );
    expect(result.delegation.delegator).to.equal(account.address);
    expect(result.delegation.signature).to.match(/^0x[a-fA-F0-9]+$/u);
  });

  it('should add additional caveats to the redelegation', async () => {
    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await redelegatePermissionContext(client, {
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      delegate: newDelegate,
      caveats: [timestampCaveat],
    });

    expect(result.delegation.caveats).to.deep.include(timestampCaveat);
  });

  it('should inherit scope from parent when no scope is provided', async () => {
    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await redelegatePermissionContext(client, {
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      delegate: newDelegate,
      // No scope provided - should inherit from parent
      caveats: [timestampCaveat], // Add a caveat so signature doesn't fail
    });

    expect(result.delegation.delegate).to.equal(newDelegate);
    // Should have the additional caveat we added
    expect(result.delegation.caveats).to.deep.include(timestampCaveat);
  });

  it('should allow scope override even with parent', async () => {
    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const result = await redelegatePermissionContext(client, {
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      delegate: newDelegate,
      scope: {
        type: ScopeType.NativeTokenTransferAmount,
        maxAmount: 500n,
      },
    });

    expect(result.delegation.delegate).to.equal(newDelegate);
    // Should have caveats from the new scope
    expect(result.delegation.caveats.length).to.be.greaterThan(0);
  });

  it('should throw error if permission context is empty', async () => {
    const emptyContext = encodeDelegations([]);

    await expect(
      redelegatePermissionContext(client, {
        environment: mockEnvironment,
        permissionContext: emptyContext,
        delegationManager: mockDelegationManager,
        chainId: mockChainId,
        delegate: '0x2000000000000000000000000000000000000002',
      }),
    ).rejects.toThrow(
      'Permission context must contain at least one delegation',
    );
  });

  it('should throw error if no account is provided', async () => {
    const clientWithoutAccount = createWalletClient({
      chain: sepolia,
      transport: http(),
    });

    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);

    await expect(
      redelegatePermissionContext(clientWithoutAccount, {
        environment: mockEnvironment,
        permissionContext,
        delegationManager: mockDelegationManager,
        chainId: mockChainId,
        delegate: '0x2000000000000000000000000000000000000002',
      }),
    ).rejects.toThrow('Account not found');
  });

  it('should work with explicit account parameter', async () => {
    const clientWithoutAccount = createWalletClient({
      chain: sepolia,
      transport: http('https://rpc.sepolia.org'),
    });

    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await redelegatePermissionContext(clientWithoutAccount, {
      account,
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      chainId: mockChainId,
      delegate: newDelegate,
      caveats: [timestampCaveat],
    });

    expect(result.delegation.delegate).to.equal(newDelegate);
    expect(result.delegation.delegator).to.equal(account.address);
  });
});

describe('redelegatePermissionContextActions', () => {
  it('should extend a wallet client with redelegatePermissionContext', async () => {
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http('https://rpc.sepolia.org'),
    }).extend(redelegatePermissionContextActions());

    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);
    const newDelegate: Address = '0x2000000000000000000000000000000000000002';

    const timestampCaveat = {
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer as Address,
      terms:
        '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex,
      args: '0x00' as Hex,
    };

    const result = await client.redelegatePermissionContext({
      environment: mockEnvironment,
      permissionContext,
      delegationManager: mockDelegationManager,
      delegate: newDelegate,
      caveats: [timestampCaveat],
      // chainId should be inferred from client
    });

    expect(result.delegation.delegate).to.equal(newDelegate);
    expect(result.delegation.delegator).to.equal(account.address);
  });

  it('should throw error if chain is not configured and chainId is not provided', async () => {
    const clientWithoutChain = createWalletClient({
      account,
      transport: http('https://rpc.sepolia.org'),
    }).extend(redelegatePermissionContextActions());

    const rootDelegation = createDelegation({
      environment: mockEnvironment,
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: '0xabc0000000000000000000000000000000000000',
        maxAmount: 1000n,
      },
      to: account.address,
      from: '0x1000000000000000000000000000000000000001',
    });

    const permissionContext = encodeDelegations([rootDelegation]);

    await expect(
      clientWithoutChain.redelegatePermissionContext({
        environment: mockEnvironment,
        permissionContext,
        delegationManager: mockDelegationManager,
        delegate: '0x2000000000000000000000000000000000000002',
      }),
    ).rejects.toThrow('Chain ID is required');
  });
});
