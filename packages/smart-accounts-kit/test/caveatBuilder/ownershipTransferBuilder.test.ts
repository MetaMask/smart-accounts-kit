import { size, type Address } from 'viem';
import { expect, describe, it } from 'vitest';

import { ownershipTransferBuilder } from '../../src/caveatBuilder/ownershipTransferBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('ownershipTransferBuilder()', () => {
  const EXPECTED_TERMS_LENGTH = 20; // 20 bytes for the target contract address

  const environment = {
    caveatEnforcers: { OwnershipTransferEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithParams = (contractAddress: Address) => {
    const config = { contractAddress };
    return ownershipTransferBuilder(environment, config);
  };

  describe('builds a caveat', () => {
    it('should build a caveat with valid parameters', () => {
      const contractAddress = randomAddress();

      const caveat = buildWithParams(contractAddress);

      expect(caveat).to.deep.equal({
        enforcer: environment.caveatEnforcers.OwnershipTransferEnforcer,
        terms: contractAddress,
        args: '0x00',
      });
    });
  });

  it('should create a caveat with terms of the correct length', () => {
    const contractAddress = randomAddress();

    const caveat = buildWithParams(contractAddress);

    expect(size(caveat.terms)).to.equal(EXPECTED_TERMS_LENGTH);
  });
});
