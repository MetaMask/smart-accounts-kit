import type { Account, Hex } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DelegationProviderConfig,
  PaymentRequirements,
} from '../../src/experimental/delegationProvider';
import type { SmartAccountsEnvironment } from '../../src/types';

const caveatBuilderMocks = vi.hoisted(() => ({
  resolveCaveats: vi.fn(),
}));

const delegationMocks = vi.hoisted(() => ({
  createOpenDelegation: vi.fn(),
  decodeDelegations: vi.fn(),
  encodeDelegations: vi.fn(),
  prepareSignDelegationTypedData: vi.fn(),
}));

const delegationCoreMocks = vi.hoisted(() => ({
  createRedeemerTerms: vi.fn(),
}));

vi.mock('../../src/caveatBuilder', () => ({
  resolveCaveats: caveatBuilderMocks.resolveCaveats,
}));

vi.mock('../../src/delegation', () => delegationMocks);

vi.mock('@metamask/delegation-core', () => delegationCoreMocks);

const { createDelegationProvider } =
  await import('../../src/experimental/delegationProvider');

const mockDelegationManager =
  '0x1000000000000000000000000000000000000001' as Hex;
const mockRedeemerEnforcer =
  '0x2000000000000000000000000000000000000002' as Hex;
const mockDelegator = '0x3000000000000000000000000000000000000003' as Hex;
const mockSignature = '0xabc123' as Hex;
const mockTypedData = { domain: {}, message: {} };
const mockPermissionContext = '0xfeed' as Hex;
const mockAuthority =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex;

const mockRequirements: PaymentRequirements = {
  scheme: 'exact',
  network: '1',
  asset: '0x4000000000000000000000000000000000000004',
  amount: '500',
  payTo: '0x5000000000000000000000000000000000000005',
  maxTimeoutSeconds: 120,
  extra: {
    facilitatorAddresses: [
      '0x6000000000000000000000000000000000000006',
      '0x7000000000000000000000000000000000000007',
    ],
  },
};

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    address: '0x8000000000000000000000000000000000000008',
    signTypedData: vi.fn().mockResolvedValue(mockSignature),
    ...overrides,
  }) as unknown as Account;

const createMockEnvironment = (
  overrides: Partial<SmartAccountsEnvironment> = {},
): SmartAccountsEnvironment =>
  ({
    DelegationManager: mockDelegationManager,
    caveatEnforcers: {
      RedeemerEnforcer: mockRedeemerEnforcer,
    },
    ...overrides,
  }) as SmartAccountsEnvironment;

describe('createDelegationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    caveatBuilderMocks.resolveCaveats.mockReturnValue([
      {
        enforcer: '0x9000000000000000000000000000000000000009',
        terms: '0x11',
        args: '0x',
      },
    ]);
    delegationCoreMocks.createRedeemerTerms.mockReturnValue('0x22');
    delegationMocks.createOpenDelegation.mockReturnValue({
      delegate: '0xa00000000000000000000000000000000000000a',
      delegator: mockDelegator,
      authority: mockAuthority,
      caveats: [],
      salt: '0x33',
    });
    delegationMocks.prepareSignDelegationTypedData.mockReturnValue(
      mockTypedData,
    );
    delegationMocks.encodeDelegations.mockReturnValue(mockPermissionContext);
    delegationMocks.decodeDelegations.mockReturnValue([]);
  });

  it('creates and signs a delegation using default from/salt values', async () => {
    const account = createMockAccount();
    const environment = createMockEnvironment();
    const provider = createDelegationProvider({
      account,
      environment,
      caveats: [],
    });

    const result = await provider(mockRequirements);

    expect(caveatBuilderMocks.resolveCaveats).toHaveBeenCalledWith({
      environment,
      caveats: [],
      isScopeOptional: true,
    });
    expect(delegationCoreMocks.createRedeemerTerms).toHaveBeenCalledWith({
      redeemers: mockRequirements.extra?.facilitatorAddresses,
    });

    const createCallArg =
      delegationMocks.createOpenDelegation.mock.calls[0]?.[0];
    expect(createCallArg.from).toBe(account.address);
    expect(createCallArg.salt).toMatch(/^0x[0-9a-f]{64}$/u);
    expect(createCallArg.scope).toStrictEqual({
      type: 'erc20TransferAmount',
      tokenAddress: mockRequirements.asset,
      maxAmount: BigInt(mockRequirements.amount),
    });

    expect(delegationMocks.prepareSignDelegationTypedData).toHaveBeenCalledWith(
      {
        delegationManager: mockDelegationManager,
        chainId: mockRequirements.network,
        delegation: delegationMocks.createOpenDelegation.mock.results[0]?.value,
      },
    );
    expect(account.signTypedData).toHaveBeenCalledWith(mockTypedData);
    expect(delegationMocks.encodeDelegations).toHaveBeenCalledWith([
      {
        ...delegationMocks.createOpenDelegation.mock.results[0]?.value,
        signature: mockSignature,
      },
    ]);
    expect(result).toStrictEqual({
      delegationManager: mockDelegationManager,
      permissionContext: mockPermissionContext,
      delegator: mockDelegator,
    });
  });

  it('uses deferred caveats and deferred parent permission context', async () => {
    const account = createMockAccount();
    const environment = createMockEnvironment();
    const deferredCaveats = vi.fn(() => []);
    const deferredParentPermissionContext = vi.fn(() => '0xdeferred' as Hex);
    const parentDelegation = {
      delegate: '0xde100000000000000000000000000000000000e1',
      delegator: '0xde200000000000000000000000000000000000e2',
      authority: mockAuthority,
      caveats: [],
      salt: '0x99',
      signature: '0xaa',
    };
    delegationMocks.decodeDelegations.mockReturnValue([parentDelegation]);
    const provider = createDelegationProvider({
      account,
      environment,
      caveats: deferredCaveats,
      parentPermissionContext: deferredParentPermissionContext,
    });

    await provider(mockRequirements);

    expect(deferredCaveats).toHaveBeenCalledWith(mockRequirements);
    expect(deferredParentPermissionContext).toHaveBeenCalledWith(
      mockRequirements,
    );
    expect(caveatBuilderMocks.resolveCaveats).toHaveBeenCalledWith({
      environment,
      caveats: [],
      isScopeOptional: true,
    });
    expect(delegationMocks.decodeDelegations).toHaveBeenCalledWith(
      '0xdeferred',
    );
  });

  it('uses explicit from/salt and includes parent delegation when provided', async () => {
    const account = createMockAccount();
    const environment = createMockEnvironment();
    const from = '0xb00000000000000000000000000000000000000b' as Hex;
    const salt =
      '0xc00000000000000000000000000000000000000000000000000000000000000c' as Hex;
    const parentPermissionContext = '0xd0' as Hex;
    const parentDelegation = {
      delegate: '0xd1000000000000000000000000000000000000d1',
      delegator: '0xd2000000000000000000000000000000000000d2',
      authority: mockAuthority,
      caveats: [],
      salt: '0x44',
      signature: '0x55',
    };
    const existingDelegation = {
      delegate: '0xd3000000000000000000000000000000000000d3',
      delegator: '0xd4000000000000000000000000000000000000d4',
      authority: mockAuthority,
      caveats: [],
      salt: '0x66',
      signature: '0x77',
    };
    delegationMocks.decodeDelegations.mockReturnValue([
      parentDelegation,
      existingDelegation,
    ]);

    const provider = createDelegationProvider({
      account,
      environment,
      from,
      salt,
      caveats: [],
      parentPermissionContext,
    });

    await provider(mockRequirements);

    expect(delegationMocks.decodeDelegations).toHaveBeenCalledWith(
      parentPermissionContext,
    );
    expect(delegationMocks.createOpenDelegation).toHaveBeenCalledWith(
      expect.objectContaining({
        from,
        salt,
        parentDelegation,
      }),
    );
    expect(delegationMocks.encodeDelegations).toHaveBeenCalledWith([
      {
        ...delegationMocks.createOpenDelegation.mock.results[0]?.value,
        signature: mockSignature,
      },
      parentDelegation,
      existingDelegation,
    ]);
  });

  it('throws when facilitator addresses are missing', async () => {
    const account = createMockAccount();
    const provider = createDelegationProvider({
      account,
      environment: createMockEnvironment(),
    });

    await expect(
      provider({
        ...mockRequirements,
        extra: undefined,
      }),
    ).rejects.toThrow('Facilitator addresses are required');
  });

  it('throws when redeemer enforcer is missing from environment', async () => {
    const account = createMockAccount();
    const provider = createDelegationProvider({
      account,
      environment: createMockEnvironment({
        caveatEnforcers: {
          RedeemerEnforcer: undefined as unknown as Hex,
        },
      }),
    });

    await expect(provider(mockRequirements)).rejects.toThrow(
      'RedeemerEnforcer not found in environment',
    );
  });

  it('throws when parent permission context does not decode into a delegation', async () => {
    const account = createMockAccount();
    delegationMocks.decodeDelegations.mockReturnValue([]);
    const provider = createDelegationProvider({
      account,
      environment: createMockEnvironment(),
      parentPermissionContext: '0xee' as Hex,
    });

    await expect(provider(mockRequirements)).rejects.toThrow(
      'Parent permission context is not a valid delegation',
    );
  });

  it('throws when account does not support typed data signing', async () => {
    const account = createMockAccount({
      signTypedData: undefined,
    });
    const provider = createDelegationProvider({
      account,
      environment: createMockEnvironment(),
    } as DelegationProviderConfig);

    await expect(provider(mockRequirements)).rejects.toThrow(
      'Account does not support signTypedData',
    );
  });
});
