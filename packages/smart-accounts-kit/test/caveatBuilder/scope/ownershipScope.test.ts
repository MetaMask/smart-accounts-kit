import { describe, it, expect } from 'vitest';

import { createOwnershipCaveatBuilder } from '../../../src/caveatBuilder/scope/ownershipScope';
import type { OwnershipScopeConfig } from '../../../src/caveatBuilder/scope/ownershipScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createOwnershipTransferCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      OwnershipTransferEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates an Ownership Transfer CaveatBuilder', () => {
    const config: OwnershipScopeConfig = {
      type: ScopeType.OwnershipTransfer,
      contractAddress: randomAddress(),
    };

    const caveatBuilder = createOwnershipCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.OwnershipTransferEnforcer,
        args: '0x00',
        terms: config.contractAddress,
      },
    ]);
  });

  it('throws an error for invalid configuration', () => {
    const config = {
      type: ScopeType.OwnershipTransfer,
    } as unknown as OwnershipScopeConfig;

    expect(() => createOwnershipCaveatBuilder(environment, config)).to.throw(
      'Invalid ownership transfer configuration',
    );
  });
});
