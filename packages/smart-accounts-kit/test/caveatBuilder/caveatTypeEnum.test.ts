import { concat } from 'viem';
import { describe, it, expect } from 'vitest';

import { createCaveatBuilder, CaveatType } from '../../src/caveatBuilder';
import { resolveCaveats } from '../../src/caveatBuilder/resolveCaveats';
import { ScopeType } from '../../src/constants';
import { createDelegation } from '../../src/delegation';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

/**
 * This test file demonstrates the CaveatType enum usage patterns.
 * These tests verify that both enum references and string literals work interchangeably.
 */
describe('CaveatType enum usage patterns', () => {
  const environment: SmartAccountsEnvironment = {
    caveatEnforcers: {
      AllowedMethodsEnforcer: randomBytes(20),
      AllowedTargetsEnforcer: randomBytes(20),
      ValueLteEnforcer: randomBytes(20),
      ERC20TransferAmountEnforcer: randomBytes(20),
      BlockNumberEnforcer: randomBytes(20),
      LimitedCallsEnforcer: randomBytes(20),
      IdEnforcer: randomBytes(20),
      NonceEnforcer: randomBytes(20),
      TimestampEnforcer: randomBytes(20),
      NativeTokenTransferAmountEnforcer: randomBytes(20),
      NativeBalanceChangeEnforcer: randomBytes(20),
      NativeTokenPaymentEnforcer: randomBytes(20),
      ERC20BalanceChangeEnforcer: randomBytes(20),
      ERC721TransferEnforcer: randomBytes(20),
      DeployedEnforcer: randomBytes(20),
      AllowedCalldataEnforcer: randomBytes(20),
      RedeemerEnforcer: randomBytes(20),
      ArgsEqualityCheckEnforcer: randomBytes(20),
      ERC20StreamingEnforcer: randomBytes(20),
      NativeTokenStreamingEnforcer: randomBytes(20),
      ERC721BalanceChangeEnforcer: randomBytes(20),
      ERC1155BalanceChangeEnforcer: randomBytes(20),
      SpecificActionERC20TransferBatchEnforcer: randomBytes(20),
      ERC20PeriodTransferEnforcer: randomBytes(20),
      NativeTokenPeriodTransferEnforcer: randomBytes(20),
      ExactCalldataBatchEnforcer: randomBytes(20),
      ExactCalldataEnforcer: randomBytes(20),
      ExactExecutionEnforcer: randomBytes(20),
      ExactExecutionBatchEnforcer: randomBytes(20),
      MultiTokenPeriodEnforcer: randomBytes(20),
      OwnershipTransferEnforcer: randomBytes(20),
    },
  } as unknown as SmartAccountsEnvironment;

  describe('using CaveatType enum in CaveatBuilder.addCaveat()', () => {
    it('should add caveat using CaveatType.AllowedMethods enum', () => {
      const builder = createCaveatBuilder(environment);
      const selectors = [randomBytes(4), randomBytes(4)];

      // Using enum reference
      const caveats = builder
        .addCaveat(CaveatType.AllowedMethods, { selectors })
        .build();

      expect(caveats).to.have.lengthOf(1);
      expect(caveats[0]?.enforcer).to.equal(
        environment.caveatEnforcers.AllowedMethodsEnforcer,
      );
      expect(caveats[0]?.terms).to.equal(concat(selectors));
    });

    it('should add caveat using CaveatType.AllowedTargets enum', () => {
      const builder = createCaveatBuilder(environment);
      const targets = [randomAddress(), randomAddress()];

      // Using enum reference
      const caveats = builder
        .addCaveat(CaveatType.AllowedTargets, { targets })
        .build();

      expect(caveats).to.have.lengthOf(1);
      expect(caveats[0]?.enforcer).to.equal(
        environment.caveatEnforcers.AllowedTargetsEnforcer,
      );
    });

    it('should add caveat using CaveatType.ValueLte enum', () => {
      const builder = createCaveatBuilder(environment);
      const maxValue = 1000n;

      // Using enum reference
      const caveats = builder
        .addCaveat(CaveatType.ValueLte, { maxValue })
        .build();

      expect(caveats).to.have.lengthOf(1);
      expect(caveats[0]?.enforcer).to.equal(
        environment.caveatEnforcers.ValueLteEnforcer,
      );
    });

    it('should add caveat using CaveatType.LimitedCalls enum', () => {
      const builder = createCaveatBuilder(environment);
      const limit = 10;

      // Using enum reference
      const caveats = builder
        .addCaveat(CaveatType.LimitedCalls, { limit })
        .build();

      expect(caveats).to.have.lengthOf(1);
      expect(caveats[0]?.enforcer).to.equal(
        environment.caveatEnforcers.LimitedCallsEnforcer,
      );
    });

    it('should add caveat using CaveatType.Erc20TransferAmount enum', () => {
      const builder = createCaveatBuilder(environment);
      const tokenAddress = randomAddress();
      const maxAmount = 1000n;

      // Using enum reference
      const caveats = builder
        .addCaveat(CaveatType.Erc20TransferAmount, {
          tokenAddress,
          maxAmount,
        })
        .build();

      expect(caveats).to.have.lengthOf(1);
      expect(caveats[0]?.enforcer).to.equal(
        environment.caveatEnforcers.ERC20TransferAmountEnforcer,
      );
    });

    it('should work identically with string literal (existing pattern)', () => {
      const builderWithEnum = createCaveatBuilder(environment);
      const builderWithString = createCaveatBuilder(environment);
      const selectors = [randomBytes(4)];

      const enumResult = builderWithEnum
        .addCaveat(CaveatType.AllowedMethods, { selectors })
        .build();

      const stringResult = builderWithString
        .addCaveat('allowedMethods', { selectors })
        .build();

      // Both should produce the same result
      expect(enumResult).to.deep.equal(stringResult);
    });
  });

  describe('using CaveatType enum in createDelegation caveats array', () => {
    const mockDelegator = randomAddress();
    const mockDelegate = randomAddress();

    const smartAccountEnvironment: SmartAccountsEnvironment = {
      caveatEnforcers: {
        ValueLteEnforcer: randomAddress(),
        ERC20TransferAmountEnforcer: randomAddress(),
        AllowedMethodsEnforcer: randomAddress(),
        BlockNumberEnforcer: randomAddress(),
        AllowedTargetsEnforcer: randomAddress(),
        LimitedCallsEnforcer: randomAddress(),
      },
    } as unknown as SmartAccountsEnvironment;

    it('should create delegation with CaveatType enum in caveats array', () => {
      const scope = {
        type: ScopeType.Erc20TransferAmount as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope,
        to: mockDelegate,
        from: mockDelegator,
        caveats: [
          {
            type: CaveatType.LimitedCalls,
            limit: 5,
          },
        ],
      });

      // Should have scope caveats (valueLte + erc20TransferAmount) + 1 additional caveat
      expect(result.caveats.length).to.be.greaterThan(2);
    });

    it('should create delegation with string literal in caveats array', () => {
      const scope = {
        type: 'erc20TransferAmount' as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope,
        to: mockDelegate,
        from: mockDelegator,
        caveats: [
          {
            type: 'limitedCalls',
            limit: 5,
          },
        ],
      });

      expect(result.caveats.length).to.be.greaterThan(2);
    });

    it('should mix CaveatType enum and string literals in caveats array', () => {
      const scope = {
        type: ScopeType.Erc20TransferAmount as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope,
        to: mockDelegate,
        from: mockDelegator,
        caveats: [
          { type: CaveatType.LimitedCalls, limit: 5 },
          { type: 'allowedMethods', selectors: ['0x12345678'] },
        ],
      });

      // Should have scope caveats + 2 additional caveats
      expect(result.caveats.length).to.be.greaterThan(3);
    });

    it('should create delegation with CaveatType.ValueLte enum', () => {
      const scope = {
        type: ScopeType.FunctionCall as const,
        targets: [randomAddress()],
        selectors: ['0x12345678'],
      };

      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope,
        to: mockDelegate,
        from: mockDelegator,
        caveats: [
          {
            type: CaveatType.ValueLte,
            maxValue: 1000n,
          },
        ],
      });

      expect(result.caveats.length).to.be.greaterThan(0);
    });
  });

  describe('using CaveatType enum in resolveCaveats', () => {
    const envWithCaveats: SmartAccountsEnvironment = {
      caveatEnforcers: {
        ValueLteEnforcer: randomAddress(),
        ERC20TransferAmountEnforcer: randomAddress(),
        AllowedMethodsEnforcer: randomAddress(),
        BlockNumberEnforcer: randomAddress(),
        AllowedTargetsEnforcer: randomAddress(),
      },
    } as unknown as SmartAccountsEnvironment;

    it('should resolve caveats with CaveatType enum', () => {
      const scope = {
        type: ScopeType.Erc20TransferAmount as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = resolveCaveats({
        environment: envWithCaveats,
        scope,
        caveats: [
          {
            type: CaveatType.AllowedMethods,
            selectors: ['0xaabbccdd'],
          },
        ],
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(2); // scope caveats + additional
    });

    it('should resolve caveats with string literal', () => {
      const scope = {
        type: 'erc20TransferAmount' as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = resolveCaveats({
        environment: envWithCaveats,
        scope,
        caveats: [
          {
            type: 'allowedMethods',
            selectors: ['0xaabbccdd'],
          },
        ],
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(2);
    });

    it('should resolve caveats with mixed enum and string', () => {
      const scope = {
        type: ScopeType.Erc20TransferAmount as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      const result = resolveCaveats({
        environment: envWithCaveats,
        scope,
        caveats: [
          { type: CaveatType.AllowedMethods, selectors: ['0xaabbccdd'] },
          { type: 'allowedTargets', targets: [randomAddress()] },
          {
            type: CaveatType.BlockNumber,
            afterThreshold: 0n,
            beforeThreshold: 1000n,
          },
        ],
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(4);
    });
  });

  describe('using ScopeType enum in scope config', () => {
    it('should create delegation with ScopeType enum reference', () => {
      const smartAccountEnvironment: SmartAccountsEnvironment = {
        caveatEnforcers: {
          ValueLteEnforcer: randomAddress(),
          ERC20TransferAmountEnforcer: randomAddress(),
        },
      } as unknown as SmartAccountsEnvironment;

      // Using enum reference for scope type
      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope: {
          type: ScopeType.Erc20TransferAmount as const,
          tokenAddress: randomAddress(),
          maxAmount: 100n,
        },
        to: randomAddress(),
        from: randomAddress(),
      });

      expect(result.caveats.length).to.be.greaterThan(0);
    });

    it('should create delegation with string literal scope type', () => {
      const smartAccountEnvironment: SmartAccountsEnvironment = {
        caveatEnforcers: {
          ValueLteEnforcer: randomAddress(),
          ERC20TransferAmountEnforcer: randomAddress(),
        },
      } as unknown as SmartAccountsEnvironment;

      // Using string literal for scope type
      const result = createDelegation({
        environment: smartAccountEnvironment,
        scope: {
          type: 'erc20TransferAmount' as const,
          tokenAddress: randomAddress(),
          maxAmount: 100n,
        },
        to: randomAddress(),
        from: randomAddress(),
      });

      expect(result.caveats.length).to.be.greaterThan(0);
    });
  });

  describe('TypeScript type inference verification', () => {
    // These tests verify TypeScript types are correctly inferred
    // If TypeScript compilation passes, the types are correct

    it('should allow CaveatType enum in addCaveat', () => {
      const builder = createCaveatBuilder(environment);

      // This should compile without errors if types are correct
      builder.addCaveat(CaveatType.AllowedMethods, {
        selectors: ['0x12345678'],
      });
      builder.addCaveat(CaveatType.ValueLte, { maxValue: 1000n });
      builder.addCaveat(CaveatType.AllowedTargets, {
        targets: [randomAddress()],
      });

      const caveats = builder.build();
      expect(caveats).to.have.lengthOf(3);
    });

    it('should allow string literals in addCaveat', () => {
      const builder = createCaveatBuilder(environment);

      // This should also compile without errors
      builder.addCaveat('allowedMethods', {
        selectors: ['0x12345678'],
      });
      builder.addCaveat('valueLte', { maxValue: 1000n });
      builder.addCaveat('allowedTargets', {
        targets: [randomAddress()],
      });

      const caveats = builder.build();
      expect(caveats).to.have.lengthOf(3);
    });

    it('should allow CaveatType enum in caveats array', () => {
      const scope = {
        type: ScopeType.Erc20TransferAmount as const,
        tokenAddress: randomAddress(),
        maxAmount: 100n,
      };

      // This should compile if types are correct
      const result = createDelegation({
        environment,
        scope,
        to: randomAddress(),
        from: randomAddress(),
        caveats: [
          { type: CaveatType.LimitedCalls, limit: 10 },
          { type: CaveatType.ValueLte, maxValue: 500n },
        ],
      });

      expect(result.caveats.length).to.be.greaterThan(2);
    });
  });
});
