import { concat, toFunctionSelector, size } from 'viem';
import type { AbiFunction, Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import type { MethodSelector } from '../../src/caveatBuilder/allowedMethodsBuilder';
import { allowedMethodsBuilder } from '../../src/caveatBuilder/allowedMethodsBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

describe('allowedMethodsBuilder()', () => {
  const EXPECTED_TERMS_LENGTH_TWO_SELECTORS = 8; // 4 bytes per selector * 2 selectors

  const environment = {
    caveatEnforcers: { AllowedMethodsEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithSelectors = (selectors: MethodSelector[]) => {
    const config = { selectors };
    return allowedMethodsBuilder(environment, config);
  };

  describe('validation', () => {
    it("should fail with method selectors that aren't hex", () => {
      const selectors: Hex[] = ['invalid-selector' as Hex];

      expect(() => buildWithSelectors(selectors)).to.throw(
        'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      );
    });

    it("should fail with method selectors that aren't 4 bytes", () => {
      const selectors: Hex[] = ['0x12'];

      expect(() => buildWithSelectors(selectors)).to.throw(
        'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      );
    });

    it('should fail invalid selectors interspersed with valid selectors', () => {
      const selectors: Hex[] = [
        randomBytes(4),
        '0x12',
        randomBytes(4),
        'invalid-selector' as Hex,
        randomBytes(4),
      ];

      expect(() => buildWithSelectors(selectors)).to.throw(
        'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      );
    });

    it('should fail with no method selectors', () => {
      const selectors: Hex[] = [];

      expect(() => buildWithSelectors(selectors)).to.throw(
        'Invalid selectors: must provide at least one selector',
      );
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with a valid selector', () => {
      const selectors = [randomBytes(4)];

      const caveat = buildWithSelectors(selectors);
      const terms = concat(selectors);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with a function signature', () => {
      const selector = 'myFunction(uint256)';

      const caveat = buildWithSelectors([selector]);
      const terms = toFunctionSelector(selector);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with an AbiFunction', () => {
      const selector: AbiFunction = {
        name: 'myFunction',
        type: 'function',
        inputs: [{ name: 'myParameter', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      };

      const caveat = buildWithSelectors([selector]);
      const terms = toFunctionSelector(selector);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with different method types', () => {
      const selector1 = '0x12345678';
      const selector2 = 'aVerySpecialFunction()';
      const selector3: AbiFunction = {
        name: 'myFunction',
        type: 'function',
        inputs: [{ name: 'myParameter', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      };

      const caveat = buildWithSelectors([selector1, selector2, selector3]);

      const terms = concat([
        selector1,
        toFunctionSelector(selector2),
        toFunctionSelector(selector3),
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        terms,
        args: '0x00',
      });
    });

    it('should build a caveat with a number of valid selectors', () => {
      const selectors = Array.from({ length: 8 }, () => randomBytes(4));

      const caveat = buildWithSelectors(selectors);
      const terms = concat(selectors);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of selectors', () => {
    const selectors = [randomBytes(4), randomBytes(4)];

    const caveat = buildWithSelectors(selectors);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH_TWO_SELECTORS);
  });
});
