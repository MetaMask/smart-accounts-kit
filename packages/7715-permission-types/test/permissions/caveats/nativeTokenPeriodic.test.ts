import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createNativeTokenPeriodicCaveats,
  makeNativeTokenPeriodicDecoderConfig,
  type NativeTokenPeriodicEnforcers,
} from '../../../src/permissions/caveats/nativeTokenPeriodic';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { nativePayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  MAX_PERIOD_DURATION,
} from '../../../src/permissions/utils';
import type {
  NativeTokenPeriodicPermission,
  Populated,
} from '../../../src/types';
import { toWord } from '../../test-utils';

describe('native-token-periodic decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    nativeTokenPeriodicEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeNativeTokenPeriodicDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );
  const START_TIME = 1715664;
  const makeTerms = ({
    periodAmount = 100n,
    periodDuration = 86400,
    startDate = START_TIME,
  }: {
    periodAmount?: bigint;
    periodDuration?: number;
    startDate?: number;
  }): Hex => {
    return `0x${toWord(periodAmount)}${toWord(periodDuration)}${toWord(startDate)}` as Hex;
  };

  const makeCaveats = (
    nativeTokenPeriodicTerms: Hex,
    exactCalldataTerms: Hex = '0x',
  ): ChecksumCaveat[] => [
    {
      enforcer: nativeTokenPeriodicEnforcer,
      terms: nativeTokenPeriodicTerms,
      args: '0x',
    },
    {
      enforcer: exactCalldataEnforcer,
      terms: exactCalldataTerms,
      args: '0x',
    },
    {
      enforcer: nonceEnforcer,
      terms: '0x',
      args: '0x',
    },
  ];

  describe('static configuration', () => {
    it('exposes expected required enforcers', () => {
      expect(decoder.requiredEnforcers).toStrictEqual({
        [nativeTokenPeriodicEnforcer]: 1,
        [exactCalldataEnforcer]: 1,
        [nonceEnforcer]: 1,
      });
    });

    it('exposes expected optional enforcers', () => {
      expect(decoder.optionalEnforcers).toStrictEqual([
        timestampEnforcer,
        redeemerEnforcer,
        allowedTargetsEnforcer,
      ]);
    });

    it('includes expected rule decoders in order', () => {
      expect(decoder.rules).toStrictEqual([
        expiryRuleDecoder,
        redeemerRuleDecoder,
        nativePayeeRuleDecoder,
      ]);
    });
  });

  describe('validateAndDecodeData', () => {
    it('provides a validateAndDecodeData function', () => {
      expect(typeof decoder.validateAndDecodeData).toBe('function');
    });

    it('is included in makePermissionDecoderConfigs', () => {
      expect(makePermissionDecoderConfigs(contracts)).toContainEqual(decoder);
    });

    it('validateAndDecodeData decodes valid periodic terms', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({})),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        periodAmount: bigIntToHex(100n),
        periodDuration: 86400,
        startTime: START_TIME,
      });
    });

    it('validateAndDecodeData rejects exact-calldata terms that are not 0x', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({}), '0x00'),
          decoder.contractAddresses,
        ),
      ).toThrow('Invalid exact-calldata terms: must be 0x');
    });

    it('validateAndDecodeData rejects when periodDuration is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: 0 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-periodic terms: periodDuration must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when periodAmount is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodAmount: 0n })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-periodic terms: periodAmount must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ startDate: 0 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-periodic terms: startTime must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when periodDuration exceeds MAX_PERIOD_DURATION', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: MAX_PERIOD_DURATION + 1 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-periodic terms: periodDuration must be less than or equal to MAX_PERIOD_DURATION',
      );
    });

    it('validateAndDecodeData accepts periodDuration equal to MAX_PERIOD_DURATION', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: MAX_PERIOD_DURATION })),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        periodAmount: bigIntToHex(100n),
        periodDuration: MAX_PERIOD_DURATION,
        startTime: START_TIME,
      });
    });
  });
});

describe('createNativeTokenPeriodicCaveats()', () => {
  const periodAmount = '0x64' as const;
  const periodDuration = 86400;
  const startTime = 1729900800;

  const contracts: NativeTokenPeriodicEnforcers = {
    nativeTokenPeriodicEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    exactCalldataEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const permission: Populated<NativeTokenPeriodicPermission> = {
    type: 'native-token-periodic',
    data: {
      periodAmount,
      periodDuration,
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates nativeTokenPeriodic and exactCalldata caveats', () => {
    const caveats = createNativeTokenPeriodicCaveats({
      permission,
      contracts,
    });

    const nativeTokenPeriodicExpectedTerms = `0x${toWord(BigInt(periodAmount))}${toWord(periodDuration)}${toWord(startTime)}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.nativeTokenPeriodicEnforcer,
        terms: nativeTokenPeriodicExpectedTerms,
        args: '0x',
      },
      {
        enforcer: contracts.exactCalldataEnforcer,
        terms: '0x',
        args: '0x',
      },
    ]);
  });

  it('rejects malformed numeric hex input', () => {
    const invalidPermission = {
      ...permission,
      data: {
        ...permission.data,
        periodAmount: 'not-hex' as Hex,
      },
    };

    expect(() =>
      createNativeTokenPeriodicCaveats({
        permission: invalidPermission,
        contracts,
      }),
    ).toThrow();
  });

  it('rejects when periodAmount is zero', () => {
    expect(() =>
      createNativeTokenPeriodicCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            periodAmount: '0x0',
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid native-token-periodic permission: periodAmount must be a positive number.',
    );
  });

  it('rejects when periodDuration is zero', () => {
    expect(() =>
      createNativeTokenPeriodicCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            periodDuration: 0,
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid native-token-periodic permission: periodDuration must be a positive number.',
    );
  });

  it('rejects when periodDuration exceeds MAX_PERIOD_DURATION', () => {
    expect(() =>
      createNativeTokenPeriodicCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            periodDuration: MAX_PERIOD_DURATION + 1,
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid native-token-periodic permission: periodDuration must be less than or equal to MAX_PERIOD_DURATION.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createNativeTokenPeriodicCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            startTime: 0,
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid native-token-periodic permission: startTime must be a positive number.',
    );
  });

  it('keeps exactCalldata caveat fixed across varied inputs', () => {
    const variedPermission: Populated<NativeTokenPeriodicPermission> = {
      ...permission,
      data: {
        ...permission.data,
        periodAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        periodDuration: 1,
        startTime: 1,
      },
    };

    const caveats = createNativeTokenPeriodicCaveats({
      permission: variedPermission,
      contracts,
    });

    expect(caveats[1]?.enforcer).toBe(contracts.exactCalldataEnforcer);
    expect(caveats[1]?.terms).toBe('0x');
  });
});
