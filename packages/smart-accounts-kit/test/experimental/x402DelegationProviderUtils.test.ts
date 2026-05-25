import {
  createAllowedCalldataTerms,
  createRedeemerTerms,
} from '@metamask/delegation-core';
import type { Hex, Account } from 'viem';
import { describe, expect, it } from 'vitest';

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

const redeemerEnforcer = '0x1000000000000000000000000000000000000001' as Hex;
const allowedCalldataEnforcer =
  '0x2000000000000000000000000000000000000002' as Hex;
const facilitatorA = '0x3000000000000000000000000000000000000003' as Hex;
const facilitatorB = '0x4000000000000000000000000000000000000004' as Hex;
const facilitatorC = '0x5000000000000000000000000000000000000005' as Hex;
const payee = '0x6000000000000000000000000000000000000006' as Hex;
const otherPayee = '0x7000000000000000000000000000000000000007' as Hex;
const rootAuthority = `0x${'00'.repeat(32)}`;
const baseEnvironment = {
  DelegationManager: '0xa00000000000000000000000000000000000000a',
  EntryPoint: '0xa10000000000000000000000000000000000000a',
  SimpleFactory: '0xa20000000000000000000000000000000000000a',
  implementations: {},
  caveatEnforcers: {
    RedeemerEnforcer: redeemerEnforcer,
    AllowedCalldataEnforcer: allowedCalldataEnforcer,
  },
} as unknown as SmartAccountsEnvironment;
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
  });

  describe('resolveDelegationCreationContext', () => {
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
  });
});
