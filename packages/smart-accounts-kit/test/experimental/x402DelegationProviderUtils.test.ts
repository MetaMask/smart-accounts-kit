import {
  createAllowedCalldataTerms,
  createRedeemerTerms,
  createTimestampTerms,
  decodeTimestampTerms,
} from '@metamask/delegation-core';
import type { Hex, Account } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import {
  ensurePayeeSufficientlyConstrained,
  ensureRedeemerSufficientlyConstrained,
  resolvex402DelegationCaveats,
  resolveDelegationCreationContext,
} from '../../src/experimental/x402DelegationProviderUtils';
import type {
  Caveat,
  Delegation,
  SmartAccountsEnvironment,
} from '../../src/types';

const redeemerEnforcer = '0x1000000000000000000000000000000000000001' as const;
const allowedCalldataEnforcer =
  '0x2000000000000000000000000000000000000002' as const;
const timestampEnforcer = '0x2000000000000000000000000000000000000003' as const;
const facilitatorA = '0x3000000000000000000000000000000000000003' as const;
const facilitatorB = '0x4000000000000000000000000000000000000004' as const;
const facilitatorC = '0x5000000000000000000000000000000000000005' as const;
const payee = '0x6000000000000000000000000000000000000006' as const;
const otherPayee = '0x7000000000000000000000000000000000000007' as const;
const rootAuthority = `0x${'00'.repeat(32)}` as const;
const baseEnvironment = {
  DelegationManager: '0xa00000000000000000000000000000000000000a',
  EntryPoint: '0xa10000000000000000000000000000000000000a',
  SimpleFactory: '0xa20000000000000000000000000000000000000a',
  implementations: {},
  caveatEnforcers: {
    RedeemerEnforcer: redeemerEnforcer,
    AllowedCalldataEnforcer: allowedCalldataEnforcer,
    TimestampEnforcer: timestampEnforcer,
  },
} as SmartAccountsEnvironment;
const mockAccount = {
  address: '0x8000000000000000000000000000000000000008',
} as unknown as Account;

const makeDelegation = (caveats: Caveat[]): Delegation => ({
  delegate: '0x8000000000000000000000000000000000000008',
  delegator: '0x9000000000000000000000000000000000000009',
  authority: rootAuthority,
  caveats,
  salt: `0x${'11'.repeat(32)}`,
  signature: `0x${'22'.repeat(65)}`,
});

describe('x402DelegationProviderUtils', () => {
  describe('ensureRedeemerSufficientlyConstrained', () => {
    it('throws when facilitators are missing and no redeemer caveat exists', () => {
      expect(() =>
        ensureRedeemerSufficientlyConstrained({
          redeemerEnforcer,
          caveats: [],
          existingDelegations: [],
          facilitatorAddresses: undefined,
        }),
      ).toThrow('Redeemer must be constrained');
    });

    it('returns caveats unchanged when facilitators are missing but parent has redeemer caveat', () => {
      const initialCaveats: Caveat[] = [
        {
          enforcer: '0xa00000000000000000000000000000000000000a',
          terms: '0x1234',
          args: '0x',
        },
      ];

      const result = ensureRedeemerSufficientlyConstrained({
        redeemerEnforcer,
        caveats: initialCaveats,
        existingDelegations: [
          makeDelegation([
            {
              enforcer: redeemerEnforcer,
              terms: createRedeemerTerms({ redeemers: [facilitatorA] }),
              args: '0x',
            },
          ]),
        ],
        facilitatorAddresses: undefined,
      });

      expect(result).toStrictEqual(initialCaveats);
    });

    it('does not append when an existing redeemer caveat is already sufficiently constrained', () => {
      const initialCaveats: Caveat[] = [
        {
          enforcer: redeemerEnforcer,
          terms: createRedeemerTerms({ redeemers: [facilitatorA] }),
          args: '0x',
        },
      ];

      const result = ensureRedeemerSufficientlyConstrained({
        redeemerEnforcer,
        caveats: initialCaveats,
        existingDelegations: [],
        facilitatorAddresses: [facilitatorA, facilitatorB],
      });

      expect(result).toStrictEqual(initialCaveats);
    });

    it('appends a redeemer caveat when existing constraints are too broad', () => {
      const initialCaveats: Caveat[] = [];

      const result = ensureRedeemerSufficientlyConstrained({
        redeemerEnforcer,
        caveats: initialCaveats,
        existingDelegations: [
          makeDelegation([
            {
              enforcer: redeemerEnforcer,
              terms: createRedeemerTerms({
                redeemers: [facilitatorA, facilitatorC],
              }),
              args: '0x',
            },
          ]),
        ],
        facilitatorAddresses: [facilitatorA, facilitatorB],
      });

      expect(result).toContainEqual({
        enforcer: redeemerEnforcer,
        terms: createRedeemerTerms({ redeemers: [facilitatorA, facilitatorB] }),
        args: '0x',
      });
    });
  });

  describe('ensurePayeeSufficientlyConstrained', () => {
    it('returns caveats unchanged when current caveats already constrain payee', () => {
      const matchingTerms = createAllowedCalldataTerms({
        startIndex: 4,
        value: payee,
      });
      const initialCaveats: Caveat[] = [
        {
          enforcer: allowedCalldataEnforcer,
          terms: matchingTerms,
          args: '0x',
        },
      ];

      const result = ensurePayeeSufficientlyConstrained({
        allowedCalldataEnforcer,
        caveats: initialCaveats,
        existingDelegations: [],
        payee,
      });

      expect(result).toStrictEqual(initialCaveats);
    });

    it('returns caveats unchanged when parent caveats already constrain payee', () => {
      const initialCaveats: Caveat[] = [
        {
          enforcer: '0xb00000000000000000000000000000000000000b',
          terms: '0x5678',
          args: '0x',
        },
      ];

      const result = ensurePayeeSufficientlyConstrained({
        allowedCalldataEnforcer,
        caveats: initialCaveats,
        existingDelegations: [
          makeDelegation([
            {
              enforcer: allowedCalldataEnforcer,
              terms: createAllowedCalldataTerms({
                startIndex: 4,
                value: payee,
              }),
              args: '0x',
            },
          ]),
        ],
        payee,
      });

      expect(result).toStrictEqual(initialCaveats);
    });

    it('appends a payee caveat when no matching allowed calldata constraint exists', () => {
      const initialCaveats: Caveat[] = [];

      const result = ensurePayeeSufficientlyConstrained({
        allowedCalldataEnforcer,
        caveats: initialCaveats,
        existingDelegations: [
          makeDelegation([
            {
              enforcer: allowedCalldataEnforcer,
              terms: createAllowedCalldataTerms({
                startIndex: 4,
                value: otherPayee,
              }),
              args: '0x',
            },
          ]),
        ],
        payee,
      });

      expect(result).toContainEqual({
        enforcer: allowedCalldataEnforcer,
        terms: createAllowedCalldataTerms({
          startIndex: 4,
          value: payee,
        }),
        args: '0x',
      });
    });
  });

  describe('resolvex402DelegationCaveats', () => {
    it('throws when RedeemerEnforcer is missing from environment', () => {
      expect(() =>
        resolvex402DelegationCaveats({
          environment: {
            ...baseEnvironment,
            caveatEnforcers: {
              ...baseEnvironment.caveatEnforcers,
              RedeemerEnforcer: undefined as unknown as Hex,
            },
          },
          caveatsConfig: undefined,
          existingDelegations: [],
          facilitatorAddresses: [facilitatorA],
          payee,
        }),
      ).toThrow('RedeemerEnforcer not found in environment');
    });

    it('throws when AllowedCalldataEnforcer is missing from environment', () => {
      expect(() =>
        resolvex402DelegationCaveats({
          environment: {
            ...baseEnvironment,
            caveatEnforcers: {
              ...baseEnvironment.caveatEnforcers,
              AllowedCalldataEnforcer: undefined as unknown as Hex,
            },
          },
          caveatsConfig: undefined,
          existingDelegations: [],
          facilitatorAddresses: [facilitatorA],
          payee,
        }),
      ).toThrow('AllowedCalldataEnforcer not found in environment');
    });

    it('adds a timestamp caveat when expirySeconds is specified', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const result = resolvex402DelegationCaveats({
        environment: baseEnvironment,
        caveatsConfig: [],
        existingDelegations: [],
        facilitatorAddresses: [facilitatorA],
        payee,
        expirySeconds: 3600,
      });

      const timestampCaveat = result.find(
        ({ enforcer }) => enforcer === timestampEnforcer,
      );
      expect(timestampCaveat).toBeDefined();
      if (!timestampCaveat) {
        throw new Error('Expected timestamp caveat to be present');
      }
      expect(decodeTimestampTerms(timestampCaveat.terms)).toStrictEqual({
        afterThreshold: 0,
        beforeThreshold: 1704070800,
      });

      vi.useRealTimers();
    });

    it('does not add a timestamp caveat when an existing caveat is more restrictive', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const result = resolvex402DelegationCaveats({
        environment: baseEnvironment,
        caveatsConfig: [],
        existingDelegations: [
          makeDelegation([
            {
              enforcer: timestampEnforcer,
              terms: createTimestampTerms({
                afterThreshold: 0,
                beforeThreshold: 1704070000,
              }),
              args: '0x',
            },
          ]),
        ],
        facilitatorAddresses: [facilitatorA],
        payee,
        expirySeconds: 3600,
      });

      const timestampCaveats = result.filter(
        ({ enforcer }) => enforcer === timestampEnforcer,
      );
      expect(timestampCaveats).toHaveLength(0);

      vi.useRealTimers();
    });

    it('adds a timestamp caveat when existing timestamp has no upper bound', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const result = resolvex402DelegationCaveats({
        environment: baseEnvironment,
        caveatsConfig: [],
        existingDelegations: [
          makeDelegation([
            {
              enforcer: timestampEnforcer,
              terms: createTimestampTerms({
                afterThreshold: 0,
                beforeThreshold: 0,
              }),
              args: '0x',
            },
          ]),
        ],
        facilitatorAddresses: [facilitatorA],
        payee,
        expirySeconds: 3600,
      });

      const timestampCaveat = result.find(
        ({ enforcer }) => enforcer === timestampEnforcer,
      );
      expect(timestampCaveat).toBeDefined();
      if (!timestampCaveat) {
        throw new Error('Expected timestamp caveat to be present');
      }
      expect(decodeTimestampTerms(timestampCaveat.terms)).toStrictEqual({
        afterThreshold: 0,
        beforeThreshold: 1704070800,
      });

      vi.useRealTimers();
    });

    it('throws when expirySeconds is specified but TimestampEnforcer is missing', () => {
      expect(() =>
        resolvex402DelegationCaveats({
          environment: {
            ...baseEnvironment,
            caveatEnforcers: {
              ...baseEnvironment.caveatEnforcers,
              TimestampEnforcer: undefined as unknown as Hex,
            },
          },
          caveatsConfig: [],
          existingDelegations: [],
          facilitatorAddresses: [facilitatorA],
          payee,
          expirySeconds: 60,
        }),
      ).toThrow('TimestampEnforcer not found in environment');
    });
  });

  describe('resolveDelegationCreationContext', () => {
    it('resolves deferred account, environment, from, and salt', async () => {
      const deferredAccount = vi.fn(async () => mockAccount);
      const deferredEnvironment = vi.fn(async () => baseEnvironment);
      const deferredFrom = vi.fn(
        async () => '0xba000000000000000000000000000000000000ba' as const,
      );
      const deferredSalt = vi.fn(
        async (): Promise<Hex> => `0x${'55'.repeat(32)}`,
      );

      const result = await resolveDelegationCreationContext(
        {
          account: deferredAccount,
          environment: deferredEnvironment,
          from: deferredFrom,
          salt: deferredSalt,
          caveats: [],
        },
        {
          scheme: 'exact',
          network: 'eip155:1',
          asset: facilitatorA,
          amount: '1',
          payTo: payee,
          maxTimeoutSeconds: 120,
          extra: { facilitatorAddresses: [facilitatorA] },
        },
      );

      expect(deferredAccount).toHaveBeenCalledOnce();
      expect(deferredEnvironment).toHaveBeenCalledOnce();
      expect(deferredFrom).toHaveBeenCalledOnce();
      expect(deferredSalt).toHaveBeenCalledOnce();
      expect(result.account).toBe(mockAccount);
      expect(result.delegationManager).toBe(baseEnvironment.DelegationManager);
      expect(result.createDelegationConfig).toEqual(
        expect.objectContaining({
          from: '0xba000000000000000000000000000000000000ba',
          salt: `0x${'55'.repeat(32)}`,
          environment: baseEnvironment,
        }),
      );
    });

    it('uses deferred caveats and deferred parent permission context', async () => {
      const parentDelegation = makeDelegation([]);
      const deferredCaveats = vi.fn(async () => []);
      const deferredParentPermissionContext = vi.fn(
        async () => [parentDelegation] as Delegation[],
      );

      const result = await resolveDelegationCreationContext(
        {
          account: mockAccount,
          environment: baseEnvironment,
          caveats: deferredCaveats,
          parentPermissionContext: deferredParentPermissionContext,
          salt: `0x${'33'.repeat(32)}`,
        },
        {
          scheme: 'exact',
          network: 'eip155:1',
          asset: facilitatorA,
          amount: '1',
          payTo: payee,
          maxTimeoutSeconds: 120,
          extra: { facilitatorAddresses: [facilitatorA] },
        },
      );

      expect(deferredCaveats).toHaveBeenCalledOnce();
      expect(deferredParentPermissionContext).toHaveBeenCalledOnce();
      expect(result.createDelegationConfig).toEqual(
        expect.objectContaining({
          parentDelegation,
        }),
      );
    });

    it('uses explicit from/salt and parent delegation when provided', async () => {
      const parentDelegation = makeDelegation([]);
      const from = '0xb00000000000000000000000000000000000000b' as const;
      const salt = `0x${'44'.repeat(32)}` as const;

      const result = await resolveDelegationCreationContext(
        {
          account: mockAccount,
          environment: baseEnvironment,
          from,
          salt,
          caveats: [],
          parentPermissionContext: [parentDelegation],
        },
        {
          scheme: 'exact',
          network: 'eip155:1',
          asset: facilitatorA,
          amount: '1',
          payTo: payee,
          maxTimeoutSeconds: 120,
          extra: { facilitatorAddresses: [facilitatorA] },
        },
      );

      expect(result.createDelegationConfig).toEqual(
        expect.objectContaining({
          from,
          salt,
          parentDelegation,
        }),
      );
      expect(result.existingDelegations).toStrictEqual([parentDelegation]);
    });

    it('throws when parent permission context does not decode into a delegation', async () => {
      await expect(
        resolveDelegationCreationContext(
          {
            account: mockAccount,
            environment: baseEnvironment,
            caveats: [],
            parentPermissionContext: [],
            salt: `0x${'33'.repeat(32)}`,
          },
          {
            scheme: 'exact',
            network: 'eip155:1',
            asset: facilitatorA,
            amount: '1',
            payTo: payee,
            maxTimeoutSeconds: 120,
            extra: { facilitatorAddresses: [facilitatorA] },
          },
        ),
      ).rejects.toThrow('Parent permission context is not a valid delegation');
    });

    it('throws when facilitators are missing and no redeemer caveat exists', async () => {
      await expect(
        resolveDelegationCreationContext(
          {
            account: mockAccount,
            environment: baseEnvironment,
            salt: `0x${'33'.repeat(32)}`,
          },
          {
            scheme: 'exact',
            network: 'eip155:1',
            asset: facilitatorA,
            amount: '1',
            payTo: payee,
            maxTimeoutSeconds: 120,
            extra: undefined,
          },
        ),
      ).rejects.toThrow('Redeemer must be constrained');
    });

    it('resolves deferred expirySeconds and applies timestamp caveat', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const deferredExpirySeconds = vi.fn(async () => 120);
      const result = await resolveDelegationCreationContext(
        {
          account: mockAccount,
          environment: baseEnvironment,
          caveats: [],
          salt: `0x${'66'.repeat(32)}`,
          expirySeconds: deferredExpirySeconds,
        },
        {
          scheme: 'exact',
          network: 'eip155:1',
          asset: facilitatorA,
          amount: '1',
          payTo: payee,
          maxTimeoutSeconds: 120,
          extra: { facilitatorAddresses: [facilitatorA] },
        },
      );

      expect(deferredExpirySeconds).toHaveBeenCalledOnce();
      const caveats = result.createDelegationConfig.caveats as Caveat[];
      const timestampCaveat = caveats.find(
        ({ enforcer }) => enforcer === timestampEnforcer,
      );
      expect(timestampCaveat).toBeDefined();
      if (!timestampCaveat) {
        throw new Error('Expected timestamp caveat to be present');
      }
      expect(decodeTimestampTerms(timestampCaveat.terms)).toStrictEqual({
        afterThreshold: 0,
        beforeThreshold: 1704067320,
      });

      vi.useRealTimers();
    });
  });
});
