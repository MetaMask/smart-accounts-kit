import { concat, size, toHex, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { allowedCalldataBuilder } from '../../src/caveatBuilder/allowedCalldataBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('allowedCalldataBuilder()', () => {
  const EXPECTED_TERMS_LENGTH_EXCLUDING_CALLDATA = 32; // 32 bytes for startIndex

  const environment = {
    caveatEnforcers: { AllowedCalldataEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (dataStart: number, value: Hex) => {
    const config = { startIndex: dataStart, value };
    return allowedCalldataBuilder(environment, config);
  };

  describe('validation', () => {
    it('should fail with empty value', () => {
      expect(() => buildWithParams(0, '' as Hex)).to.throw(
        'Invalid value: must be a hex string starting with 0x',
      );
    });

    it('should fail with negative dataStart', () => {
      expect(() => buildWithParams(-1, '0x1234')).to.throw(
        'Invalid startIndex: must be zero or positive',
      );
    });

    it('should fail with non-integer dataStart', () => {
      expect(() => buildWithParams(1.1, '0x1234')).to.throw(
        'Invalid startIndex: must be a whole number',
      );
    });

    it('should allow valid parameters', () => {
      expect(() => buildWithParams(0, '0x1234')).to.not.throw();
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const startIndex = 32;
      const value = '0x1234';

      const caveat = buildWithParams(startIndex, value);
      const dataStartHex = toHex(startIndex, { size: 32 });
      const expectedTerms = concat([dataStartHex, value]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.AllowedCalldataEnforcer,
        terms: expectedTerms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms of the correct length', () => {
    const startIndex = 32;
    const value = '0x1234';

    const caveat = buildWithParams(startIndex, value);

    expect(size(caveat.terms)).to.equal(
      EXPECTED_TERMS_LENGTH_EXCLUDING_CALLDATA + size(value),
    );
  });
});
