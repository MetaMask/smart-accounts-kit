import { createTimestampTerms } from '@metamask/delegation-core';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { checksumEnforcerAddresses } from '../../../src/permissions/utils';
import { contracts } from '../../test-utils';

describe('expiryRule', () => {
  const contractAddresses = checksumEnforcerAddresses(contracts);
  const { timestampEnforcer, nonceEnforcer } = contractAddresses;
  const requiredEnforcers = new Map<Hex, number>([[nonceEnforcer, 1]]);

  it('returns null when no TimestampEnforcer caveat is present', () => {
    const caveats: ChecksumCaveat[] = [
      { enforcer: nonceEnforcer, terms: '0x' as Hex, args: '0x' as Hex },
    ];

    expect(
      expiryRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toBeNull();
  });

  it('returns an expiry rule with the decoded timestamp when TimestampEnforcer is present', () => {
    const beforeThreshold = 1_750_000_000;
    const caveats: ChecksumCaveat[] = [
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold: 0,
          beforeThreshold,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(
      expiryRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toStrictEqual({
      type: 'expiry',
      data: { timestamp: beforeThreshold },
    });
  });

  it('ignores caveats from unrelated enforcers', () => {
    const beforeThreshold = 1_700_000_000;
    const caveats: ChecksumCaveat[] = [
      { enforcer: nonceEnforcer, terms: '0x' as Hex, args: '0x' as Hex },
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold: 0,
          beforeThreshold,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(
      expiryRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toStrictEqual({
      type: 'expiry',
      data: { timestamp: beforeThreshold },
    });
  });

  it('throws when timestampBeforeThreshold is 0', () => {
    const caveats: ChecksumCaveat[] = [
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold: 0,
          beforeThreshold: 0,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(() =>
      expiryRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toThrow(
      'Invalid expiry: timestampBeforeThreshold must be greater than 0',
    );
  });

  it('throws when timestampAfterThreshold is non-zero', () => {
    const caveats: ChecksumCaveat[] = [
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold: 1,
          beforeThreshold: 1_750_000_000,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(() =>
      expiryRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toThrow('Invalid expiry: timestampAfterThreshold must be 0');
  });
});
