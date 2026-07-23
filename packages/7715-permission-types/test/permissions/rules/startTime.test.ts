import { createTimestampTerms } from '@metamask/delegation-core';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { startTimeRuleDecoder } from '../../../src/permissions/rules/startTime';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { checksumEnforcerAddresses } from '../../../src/permissions/utils';
import { contracts } from '../../test-utils';

describe('startTimeRule', () => {
  const contractAddresses = checksumEnforcerAddresses(contracts);
  const { timestampEnforcer, nonceEnforcer } = contractAddresses;
  const requiredEnforcers = new Map<Hex, number>([[nonceEnforcer, 1]]);

  it('returns null when no TimestampEnforcer caveat is present', () => {
    const caveats: ChecksumCaveat[] = [
      { enforcer: nonceEnforcer, terms: '0x' as Hex, args: '0x' as Hex },
    ];

    expect(
      startTimeRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toBeNull();
  });

  it('returns a startTime rule with the decoded afterThreshold when TimestampEnforcer is present', () => {
    const afterThreshold = 1_700_000_000;
    const caveats: ChecksumCaveat[] = [
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold,
          beforeThreshold: 0,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(
      startTimeRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toStrictEqual({
      type: 'startTime',
      data: { startTime: afterThreshold },
    });
  });

  it('ignores caveats from unrelated enforcers', () => {
    const afterThreshold = 1_700_000_000;
    const caveats: ChecksumCaveat[] = [
      { enforcer: nonceEnforcer, terms: '0x' as Hex, args: '0x' as Hex },
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold,
          beforeThreshold: 0,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(
      startTimeRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toStrictEqual({
      type: 'startTime',
      data: { startTime: afterThreshold },
    });
  });

  it('returns null when afterThreshold is 0', () => {
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

    expect(
      startTimeRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toBeNull();
  });

  it('returns only the startTime rule when beforeThreshold is also set', () => {
    const afterThreshold = 1_700_000_000;
    const beforeThreshold = 1_750_000_000;
    const caveats: ChecksumCaveat[] = [
      {
        enforcer: timestampEnforcer,
        terms: createTimestampTerms({
          afterThreshold,
          beforeThreshold,
        }),
        args: '0x' as Hex,
      },
    ];

    expect(
      startTimeRuleDecoder({ contractAddresses, caveats, requiredEnforcers }),
    ).toStrictEqual({
      type: 'startTime',
      data: { startTime: afterThreshold },
    });
  });
});
