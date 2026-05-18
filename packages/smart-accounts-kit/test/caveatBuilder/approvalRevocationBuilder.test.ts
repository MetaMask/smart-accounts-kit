import { createApprovalRevocationTerms } from '@metamask/delegation-core';
import { expect, describe, it } from 'vitest';

import { approvalRevocationBuilder } from '../../src/caveatBuilder/approvalRevocationBuilder';
import type { SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('approvalRevocationBuilder()', () => {
  const environment = {
    caveatEnforcers: { ApprovalRevocationEnforcer: randomAddress() },
  } as any as SmartAccountsEnvironment;

  const buildWithConfig = () => {
    return approvalRevocationBuilder(environment, {
      erc20Approve: true,
      erc721Approve: false,
      erc721SetApprovalForAll: true,
      permit2ApproveZero: false,
      permit2Lockdown: true,
      permit2InvalidateNonces: false,
    });
  };

  it('should build a caveat with valid terms', () => {
    const caveat = buildWithConfig();
    const terms = createApprovalRevocationTerms({
      erc20Approve: true,
      erc721Approve: false,
      erc721SetApprovalForAll: true,
      permit2ApproveZero: false,
      permit2Lockdown: true,
      permit2InvalidateNonces: false,
    });

    expect(caveat).to.deep.equal({
      enforcer: environment.caveatEnforcers.ApprovalRevocationEnforcer,
      terms,
      args: '0x00',
    });
  });

  it('should throw when enforcer is missing in environment', () => {
    expect(() =>
      approvalRevocationBuilder(
        { caveatEnforcers: {} } as any as SmartAccountsEnvironment,
        {
          erc20Approve: true,
          erc721Approve: false,
          erc721SetApprovalForAll: false,
          permit2ApproveZero: false,
          permit2Lockdown: false,
          permit2InvalidateNonces: false,
        },
      ),
    ).to.throw('ApprovalRevocationEnforcer not found in environment');
  });
});
