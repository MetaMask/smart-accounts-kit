import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createErc20TokenPeriodicCaveats,
  makeErc20TokenPeriodicDecoderConfig,
  type Erc20TokenPeriodicEnforcers,
} from '../../../src/permissions/caveats/erc20TokenPeriodic';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { erc20PayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  MAX_PERIOD_DURATION,
  ZERO_32_BYTES,
} from '../../../src/permissions/utils';
import type {
  Erc20TokenPeriodicPermission,
  Populated,
} from '../../../src/types';
import { toWord } from '../../test-utils';

describe('erc20-token-periodic decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    erc20PeriodTransferEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeErc20TokenPeriodicDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );

  const TOKEN_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hex;
  const START_TIME = 1715664;

  const makeTerms = ({
    tokenAddress = TOKEN_ADDRESS,
    periodAmount = 100n,
    periodDuration = 86400,
    startDate = START_TIME,
  }: {
    tokenAddress?: Hex;
    periodAmount?: bigint;
    periodDuration?: number;
    startDate?: number;
  } = {}): Hex => {
    const periodAmountHex = toWord(periodAmount);
    const periodDurationHex = toWord(periodDuration);
    const startDateHex = toWord(startDate);

    return `${tokenAddress}${periodAmountHex}${periodDurationHex}${startDateHex}`;
  };

  const makeCaveats = (
    terms: Hex,
    valueLteTerms: Hex = ZERO_32_BYTES,
  ): ChecksumCaveat[] => [
    {
      enforcer: erc20PeriodTransferEnforcer,
      terms,
      args: '0x',
    },
    {
      enforcer: valueLteEnforcer,
      terms: valueLteTerms,
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
        [erc20PeriodTransferEnforcer]: 1,
        [valueLteEnforcer]: 1,
        [nonceEnforcer]: 1,
      });
    });

    it('exposes expected optional enforcers', () => {
      expect(decoder.optionalEnforcers).toStrictEqual([
        timestampEnforcer,
        redeemerEnforcer,
        allowedCalldataEnforcer,
      ]);
    });

    it('includes expected rule decoders in order', () => {
      expect(decoder.rules).toStrictEqual([
        expiryRuleDecoder,
        redeemerRuleDecoder,
        erc20PayeeRuleDecoder,
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
          makeCaveats(makeTerms()),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        tokenAddress: TOKEN_ADDRESS,
        periodAmount: bigIntToHex(100n),
        periodDuration: 86400,
        startTime: START_TIME,
      });
    });

    it('validateAndDecodeData rejects non-zero value-lte terms', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms(), `0x${'0'.repeat(63)}1` as Hex),
          decoder.contractAddresses,
        ),
      ).toThrow(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
    });

    it('validateAndDecodeData rejects when periodDuration is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: 0 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-periodic terms: periodDuration must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when periodAmount is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodAmount: 0n })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-periodic terms: periodAmount must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ startDate: 0 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-periodic terms: startTime must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when periodDuration exceeds MAX_PERIOD_DURATION', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: MAX_PERIOD_DURATION + 1 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-periodic terms: periodDuration must be less than or equal to MAX_PERIOD_DURATION',
      );
    });

    it('validateAndDecodeData accepts periodDuration equal to MAX_PERIOD_DURATION', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ periodDuration: MAX_PERIOD_DURATION })),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        tokenAddress: TOKEN_ADDRESS,
        periodAmount: bigIntToHex(100n),
        periodDuration: MAX_PERIOD_DURATION,
        startTime: START_TIME,
      });
    });
  });
});

describe('createErc20TokenPeriodicCaveats()', () => {
  const tokenAddress = '0x1234567890123456789012345678901234567890' as const;
  const periodAmount = '0x64' as const;
  const periodDuration = 86400;
  const startTime = 1729900800;

  const contracts: Erc20TokenPeriodicEnforcers = {
    erc20PeriodTransferEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    valueLteEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const permission: Populated<Erc20TokenPeriodicPermission> = {
    type: 'erc20-token-periodic',
    data: {
      tokenAddress,
      periodAmount,
      periodDuration,
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates erc20Periodic and valueLte caveats', () => {
    const caveats = createErc20TokenPeriodicCaveats({
      permission,
      contracts,
    });
    const expectedTerms = `0x${tokenAddress.slice(2)}${toWord(BigInt(periodAmount))}${toWord(periodDuration)}${toWord(startTime)}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.erc20PeriodTransferEnforcer,
        terms: expectedTerms,
        args: '0x',
      },
      {
        enforcer: contracts.valueLteEnforcer,
        terms: ZERO_32_BYTES,
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
      createErc20TokenPeriodicCaveats({
        permission: invalidPermission,
        contracts,
      }),
    ).toThrow();
  });

  it('rejects when periodAmount is zero', () => {
    expect(() =>
      createErc20TokenPeriodicCaveats({
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
      'Invalid erc20-token-periodic permission: periodAmount must be a positive number.',
    );
  });

  it('rejects when periodDuration is zero', () => {
    expect(() =>
      createErc20TokenPeriodicCaveats({
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
      'Invalid erc20-token-periodic permission: periodDuration must be a positive number.',
    );
  });

  it('rejects when periodDuration exceeds MAX_PERIOD_DURATION', () => {
    expect(() =>
      createErc20TokenPeriodicCaveats({
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
      'Invalid erc20-token-periodic permission: periodDuration must be less than or equal to MAX_PERIOD_DURATION.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createErc20TokenPeriodicCaveats({
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
      'Invalid erc20-token-periodic permission: startTime must be a positive number.',
    );
  });

  it('keeps valueLte caveat fixed at zero across varied inputs', () => {
    const variedPermission: Populated<Erc20TokenPeriodicPermission> = {
      ...permission,
      data: {
        ...permission.data,
        tokenAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        periodAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        periodDuration: 1,
        startTime: 1,
      },
    };

    const caveats = createErc20TokenPeriodicCaveats({
      permission: variedPermission,
      contracts,
    });

    expect(caveats[1]?.enforcer).toBe(contracts.valueLteEnforcer);
    expect(caveats[1]?.terms).toBe(ZERO_32_BYTES);
  });

  it('encodes provided token address in periodic terms', () => {
    const alternateTokenAddress =
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hex;
    const permissionWithAltToken = {
      ...permission,
      data: {
        ...permission.data,
        tokenAddress: alternateTokenAddress,
      },
    };

    const caveats = createErc20TokenPeriodicCaveats({
      permission: permissionWithAltToken,
      contracts,
    });
    const erc20PeriodicTerms = caveats[0]?.terms as Hex;

    expect(caveats[0]?.enforcer).toBe(contracts.erc20PeriodTransferEnforcer);
    expect(
      erc20PeriodicTerms.startsWith(`0x${alternateTokenAddress.slice(2)}`),
    ).toBe(true);
  });
});
