import type { Account, Hex } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  x402DelegationProviderConfig,
  PaymentRequirements,
} from '../../src/experimental/x402DelegationProvider';
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
  createAllowedCalldataTerms: vi.fn(),
  createRedeemerTerms: vi.fn(),
  decodeRedeemerTerms: vi.fn(),
}));

const utilsMocks = vi.hoisted(() => ({
  generateSalt: vi.fn(),
}));

vi.mock('../../src/caveatBuilder', () => ({
  resolveCaveats: caveatBuilderMocks.resolveCaveats,
}));

vi.mock('../../src/delegation', () => delegationMocks);

vi.mock('@metamask/delegation-core', () => delegationCoreMocks);
vi.mock('../../src/utils/', () => utilsMocks);

const { createx402DelegationProvider, parseEip155ChainId } =
  await import('../../src/experimental/x402DelegationProvider');

const mockDelegationManager =
  '0x1000000000000000000000000000000000000001' as Hex;
const mockRedeemerEnforcer =
  '0x2000000000000000000000000000000000000002' as Hex;
const mockPayeeEnforcer = '0x2000000000000000000000000000000000000004' as Hex;
const mockDelegator = '0x3000000000000000000000000000000000000003' as Hex;
const mockSignature = '0xabc123' as Hex;
const mockTypedData = { domain: {}, message: {} };
const mockPermissionContext = '0xfeed' as Hex;
const mockAllowedCalldataTerms = '0x3333' as Hex;
const mockGeneratedSalt =
  '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;
const mockAuthority =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex;

const mockRequirements: PaymentRequirements = {
  scheme: 'exact',
  network: 'eip155:1',
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
      AllowedCalldataEnforcer: mockPayeeEnforcer,
    },
    ...overrides,
  }) as SmartAccountsEnvironment;

describe('createx402DelegationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    caveatBuilderMocks.resolveCaveats.mockReturnValue([
      {
        enforcer: '0x9000000000000000000000000000000000000009',
        terms: '0x11',
        args: '0x',
      },
    ]);
    delegationCoreMocks.createAllowedCalldataTerms.mockReturnValue(
      mockAllowedCalldataTerms,
    );
    delegationCoreMocks.createRedeemerTerms.mockReturnValue('0x22');
    delegationCoreMocks.decodeRedeemerTerms.mockImplementation((terms: Hex) => {
      if (terms === '0x01') {
        return {
          redeemers: ['0x6000000000000000000000000000000000000006'],
        };
      }

      if (terms === '0x02') {
        return {
          redeemers: [
            '0x6000000000000000000000000000000000000006',
            '0x9000000000000000000000000000000000000009',
          ],
        };
      }

      return { redeemers: [] };
    });
    utilsMocks.generateSalt.mockReturnValue(mockGeneratedSalt);
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
    const provider = createx402DelegationProvider({
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
    expect(createCallArg.salt).toBe(mockGeneratedSalt);
    expect(createCallArg.scope).toStrictEqual({
      type: 'erc20TransferAmount',
      tokenAddress: mockRequirements.asset,
      maxAmount: BigInt(mockRequirements.amount),
    });

    expect(delegationMocks.prepareSignDelegationTypedData).toHaveBeenCalledWith(
      {
        delegationManager: mockDelegationManager,
        chainId: 1,
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

  it('parses chainId from an eip155 CAIP network identifier', async () => {
    const account = createMockAccount();
    const environment = createMockEnvironment();
    const provider = createx402DelegationProvider({
      account,
      environment,
      caveats: [],
    });

    await provider({
      ...mockRequirements,
      network: 'eip155:8453',
    });

    expect(delegationMocks.prepareSignDelegationTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 8453,
      }),
    );
  });

  it('throws when network namespace is not eip155', async () => {
    const account = createMockAccount();
    const environment = createMockEnvironment();
    const provider = createx402DelegationProvider({
      account,
      environment,
      caveats: [],
    });

    await expect(
      provider({
        ...mockRequirements,
        network: 'cosmos:cosmoshub-4',
      }),
    ).rejects.toThrow('Unsupported chain namespace');
  });

  it('throws when account does not support typed data signing', async () => {
    const account = createMockAccount({
      signTypedData: undefined,
    });
    const provider = createx402DelegationProvider({
      account,
      environment: createMockEnvironment(),
    } as x402DelegationProviderConfig);

    await expect(provider(mockRequirements)).rejects.toThrow(
      'Account does not support signTypedData',
    );
  });
});

describe('parseEip155ChainId', () => {
  it('parses a valid eip155 CAIP network', () => {
    expect(parseEip155ChainId('eip155:8453')).toBe(8453);
  });

  it('throws for non-eip155 namespaces', () => {
    expect(() => parseEip155ChainId('cosmos:cosmoshub-4')).toThrow(
      'Unsupported chain namespace',
    );
  });
});
