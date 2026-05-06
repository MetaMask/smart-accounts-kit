import { describe, it, expect } from 'vitest';

import { CaveatBuilder } from '../../src/caveatBuilder/caveatBuilder';
import type { CoreCaveatConfiguration } from '../../src/caveatBuilder/coreCaveatBuilder';
import { createCaveatBuilder } from '../../src/caveatBuilder/coreCaveatBuilder';
import { resolveCaveats } from '../../src/caveatBuilder/resolveCaveats';
import type { ScopeConfig } from '../../src/caveatBuilder/scope';
import { ScopeType } from '../../src/constants';
import type { Caveat, SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('resolveCaveats', () => {
  const environment: SmartAccountsEnvironment = {
    caveatEnforcers: {
      AllowedMethodsEnforcer: randomAddress(),
      BlockNumberEnforcer: randomAddress(),
      ValueLteEnforcer: randomAddress(),
      ERC721TransferEnforcer: randomAddress(),
      ERC20TransferAmountEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  const mockCaveat1: Caveat = {
    enforcer: randomAddress(),
    terms: '0x01' as const,
    args: '0x00',
  };

  const mockCaveat2: Caveat = {
    enforcer: randomAddress(),
    terms: '0x02' as const,
    args: '0x00',
  };

  const erc20Scope: ScopeConfig = {
    type: ScopeType.Erc20TransferAmount,
    tokenAddress: randomAddress(),
    maxAmount: 1000n,
  };

  describe('when caveats is a CaveatBuilder', () => {
    it('should resolve caveats from a CaveatBuilder instance', () => {
      const caveatBuilder = new CaveatBuilder(environment);
      caveatBuilder.addCaveat(mockCaveat1);
      caveatBuilder.addCaveat(mockCaveat2);

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: caveatBuilder,
        hasInheritance: false,
      });

      // 4 caveats: 2 from the scope, 2 from the builder
      expect(result).to.have.lengthOf(4);
      expect(result).to.deep.include(mockCaveat1);
      expect(result).to.deep.include(mockCaveat2);
    });

    it('should handle empty CaveatBuilder', () => {
      const caveatBuilder = new CaveatBuilder(environment, {
        allowInsecureUnrestrictedDelegation: true,
      });

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: caveatBuilder,
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0); // Should have scope caveats
    });

    it('should handle CoreCaveatBuilder with named caveats', () => {
      const caveatBuilder = createCaveatBuilder(environment, {
        allowInsecureUnrestrictedDelegation: true,
      });
      caveatBuilder.addCaveat('allowedMethods', {
        selectors: ['0x12345678'],
      });

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: caveatBuilder as any,
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(1); // Should have scope caveats + our added caveat
    });
  });

  describe('when caveats is an array', () => {
    it('should resolve caveats from an array of Caveat objects', () => {
      const caveats = [mockCaveat1, mockCaveat2];

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats,
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(2); // Should have scope caveats + our added caveats

      // Check that our caveats are included
      expect(result).to.deep.include(mockCaveat1);
      expect(result).to.deep.include(mockCaveat2);
    });

    it('should resolve caveats from an array of CaveatConfiguration objects', () => {
      const caveatConfigs: CoreCaveatConfiguration[] = [
        {
          type: 'allowedMethods',
          selectors: ['0x12345678'],
        },
        {
          type: 'blockNumber',
          afterThreshold: 0n,
          beforeThreshold: 1000n,
        },
      ];

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: caveatConfigs,
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(2); // Should have scope caveats + our added caveats

      // Verify that the caveats were added by checking the result contains more than just scope caveats
      const scopeOnlyResult = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: [],
        hasInheritance: false,
      });
      expect(result.length).to.be.greaterThan(scopeOnlyResult.length);
    });

    it('should resolve caveats from a mixed array of Caveat and CaveatConfiguration objects', () => {
      const mixedCaveats = [
        mockCaveat1,
        {
          type: 'allowedMethods',
          selectors: ['0x12345678'],
        } as CoreCaveatConfiguration,
        mockCaveat2,
        {
          type: 'blockNumber',
          afterThreshold: 0n,
          beforeThreshold: 1000n,
        } as CoreCaveatConfiguration,
      ];

      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: mixedCaveats,
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(4); // Should have scope caveats + our 4 added items

      // Check that our direct caveats are included
      expect(result).to.deep.include(mockCaveat1);
      expect(result).to.deep.include(mockCaveat2);
    });

    it('should handle empty array', () => {
      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: [],
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0); // Should have scope caveats
    });
  });

  describe('scope', () => {
    it('should work with different scope types', () => {
      const erc721Scope: ScopeConfig = {
        type: ScopeType.Erc721Transfer,
        tokenAddress: randomAddress(),
        tokenId: 123n,
      };

      const caveatConfig: CoreCaveatConfiguration = {
        type: 'allowedMethods',
        selectors: ['0x12345678'],
      };

      const result = resolveCaveats({
        environment,
        scope: erc721Scope,
        caveats: [caveatConfig],
        hasInheritance: false,
      });

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should include scope-specific caveats', () => {
      const resultWithCaveats = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: [mockCaveat1],
        hasInheritance: false,
      });

      const resultWithoutCaveats = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: [],
        hasInheritance: false,
      });

      expect(resultWithCaveats.length).to.be.greaterThan(
        resultWithoutCaveats.length,
      );

      expect(resultWithoutCaveats.length).to.be.greaterThan(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('fails with malformed objects gracefully', () => {
      const invalidType = {
        type: 'nonExistentType',
        someProperty: 'value',
      };

      expect(() => {
        resolveCaveats({
          environment,
          scope: erc20Scope,
          caveats: [invalidType as any],
          hasInheritance: false,
        });
      }).to.throw('Invalid caveat');
    });
  });

  describe('hasInheritance', () => {
    it('should throw if scope is not provided and the delegation has no inheritance', () => {
      expect(() =>
        resolveCaveats({
          environment,
          caveats: [mockCaveat1],
          hasInheritance: false,
        }),
      ).to.throw('Scope is required when the delegation has no inheritance');
    });

    it('should throw if neither scope nor caveats are provided and the delegation has no inheritance', () => {
      expect(() =>
        resolveCaveats({
          environment,
          hasInheritance: false,
        }),
      ).to.throw('Scope is required when the delegation has no inheritance');
    });

    it('should resolve caveats without a scope when the delegation has inheritance', () => {
      const result = resolveCaveats({
        environment,
        caveats: [mockCaveat1, mockCaveat2],
        hasInheritance: true,
      });

      // No scope caveats are added when the scope is inherited from the parent
      expect(result).to.have.lengthOf(2);
      expect(result).to.deep.include(mockCaveat1);
      expect(result).to.deep.include(mockCaveat2);
    });

    it('should return an empty array when no scope, no caveats and the delegation has inheritance', () => {
      const result = resolveCaveats({
        environment,
        hasInheritance: true,
      });

      expect(result).to.deep.equal([]);
    });

    it('should still apply scope caveats when both scope and inheritance are provided', () => {
      const result = resolveCaveats({
        environment,
        scope: erc20Scope,
        caveats: [mockCaveat1],
        hasInheritance: true,
      });

      // Scope caveats are still produced when an explicit scope is provided
      expect(result.length).to.be.greaterThan(1);
      expect(result).to.deep.include(mockCaveat1);
    });
  });
});
