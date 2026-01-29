import { concat, pad, size, type Address, type Hex } from 'viem';
import { expect, describe, it } from 'vitest';

import { deployedBuilder } from '../../src/caveatBuilder/deployedBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress, randomBytes } from '../utils';

describe('deployedBuilder()', () => {
  const EXPECTED_TERMS_LENGTH_EXCLUDING_BYTECODE = 52; // 20 bytes for contractAddress + 32 bytes for salt

  const environment = {
    caveatEnforcers: { DeployedEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithDetails = (
    contractAddress: Address,
    salt: Hex,
    bytecode: Hex,
  ) => {
    const config = { contractAddress, salt, bytecode };
    return deployedBuilder(environment, config);
  };

  const validContractAddress = randomAddress();
  const validSalt = randomBytes(32);
  const validBytecode = randomBytes(256);

  describe('validation', () => {
    it("should fail with contractAddress that isn't a valid address", () => {
      const invalidContractAddress = 'invalid-address' as Address;

      expect(() =>
        buildWithDetails(invalidContractAddress, validSalt, validBytecode),
      ).to.throw('Invalid contractAddress: must be a valid Ethereum address');
    });

    it('should fail with contractAddress that is hex, but invalid length', () => {
      const invalidContractAddress = randomBytes(10);

      expect(() =>
        buildWithDetails(invalidContractAddress, validSalt, validBytecode),
      ).to.throw('Invalid contractAddress: must be a valid Ethereum address');
    });

    it("should allow valid contractAddress, that's not checksummed", () => {
      // we uppercase here, because lowercase is considered valid by `isAddress`
      const nonChecksummedAddress: Address = `0x${randomAddress()
        .slice(2)
        .toUpperCase()}`;

      expect(() =>
        buildWithDetails(nonChecksummedAddress, validSalt, validBytecode),
      ).to.not.throw();
    });

    it('should fail with invalid salt', () => {
      const invalidSalt = 'invalid-salt' as Hex;

      expect(() =>
        buildWithDetails(validContractAddress, invalidSalt, validBytecode),
      ).to.throw('Invalid salt: must be a valid hexadecimal string');
    });

    it('should fail with invalid bytecode', () => {
      const invalidBytecode = 'invalid-bytecode' as Hex;

      expect(() =>
        buildWithDetails(validContractAddress, validSalt, invalidBytecode),
      ).to.throw('Invalid bytecode: must be a valid hexadecimal string');
    });
  });

  describe('builds a caveat', () => {
    it('should build a caveat with valid inputs', () => {
      const caveat = buildWithDetails(
        validContractAddress,
        validSalt,
        validBytecode,
      );
      const terms = concat([
        validContractAddress,
        pad(validSalt, { size: 32 }),
        validBytecode,
      ]);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.DeployedEnforcer,
        terms,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms length matching number of targets', () => {
    const contractAddress = randomAddress();
    const salt = randomBytes(32);
    const bytecode = randomBytes(256);

    const caveat = buildWithDetails(contractAddress, salt, bytecode);

    expect(size(caveat.terms)).to.equal(
      EXPECTED_TERMS_LENGTH_EXCLUDING_BYTECODE + size(bytecode),
    );
  });
});
