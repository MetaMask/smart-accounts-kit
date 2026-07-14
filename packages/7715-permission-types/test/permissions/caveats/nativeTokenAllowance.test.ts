import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createNativeTokenAllowanceCaveats,
  makeNativeTokenAllowanceDecoderConfig,
  type NativeTokenAllowanceEnforcers,
} from '../../../src/permissions/caveats/nativeTokenAllowance';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { nativePayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  UINT256_MAX,
} from '../../../src/permissions/utils';
import type {
  NativeTokenAllowancePermission,
  Populated,
} from '../../../src/types';
import { toWord } from '../../test-utils';

describe('native-token-allowance decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    nativeTokenPeriodTransferEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeNativeTokenAllowanceDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );

  const ALLOWANCE_AMOUNT_HEX = toWord(100n);
  const START_TIME = 1715664;
  const START_TIME_HEX = toWord(START_TIME);
  const VALID_ALLOWANCE_TERMS =
    `0x${ALLOWANCE_AMOUNT_HEX}${UINT256_MAX.slice(2)}${START_TIME_HEX}` as Hex;

  const makeCaveats = (
    nativeTokenPeriodicTerms: Hex,
    exactCalldataTerms: Hex = '0x',
  ): ChecksumCaveat[] => [
    {
      enforcer: nativeTokenPeriodTransferEnforcer,
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
        [nativeTokenPeriodTransferEnforcer]: 1,
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

    it('validateAndDecodeData decodes valid allowance terms', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(VALID_ALLOWANCE_TERMS),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        allowanceAmount: `0x${ALLOWANCE_AMOUNT_HEX}`,
        startTime: START_TIME,
      });
    });

    it('validateAndDecodeData rejects exact-calldata terms that are not 0x', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(VALID_ALLOWANCE_TERMS, '0x00'),
          decoder.contractAddresses,
        ),
      ).toThrow('Invalid exact-calldata terms: must be 0x');
    });

    it('validateAndDecodeData rejects invalid periodDuration', () => {
      const nonMaxDurationHex = toWord(86400);
      const invalidTerms =
        `0x${ALLOWANCE_AMOUNT_HEX}${nonMaxDurationHex}${START_TIME_HEX}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-allowance terms: periodDuration must be UINT256_MAX',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      const invalidTerms =
        `0x${ALLOWANCE_AMOUNT_HEX}${UINT256_MAX.slice(2)}${toWord(0)}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-allowance terms: startTime must be a positive number',
      );
    });

    it('validateAndDecodeData rejects zero allowanceAmount', () => {
      const zeroAllowanceAmount = '0'.repeat(64);
      const invalidTerms =
        `0x${zeroAllowanceAmount}${UINT256_MAX.slice(2)}${START_TIME_HEX}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-allowance terms: allowanceAmount must be a positive number',
      );
    });
  });
});

describe('createNativeTokenAllowanceCaveats()', () => {
  const allowanceAmount = '0x64' as const;
  const startTime = 1729900800;

  const contracts: NativeTokenAllowanceEnforcers = {
    nativeTokenPeriodTransferEnforcer:
      '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    exactCalldataEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const permission: Populated<NativeTokenAllowancePermission> = {
    type: 'native-token-allowance',
    data: {
      allowanceAmount,
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates nativeTokenPeriodic and exactCalldata caveats', () => {
    const caveats = createNativeTokenAllowanceCaveats({
      permission,
      contracts,
    });
    const expectedTerms = `0x${toWord(BigInt(allowanceAmount))}${UINT256_MAX.slice(2)}${toWord(startTime)}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.nativeTokenPeriodTransferEnforcer,
        terms: expectedTerms,
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
        allowanceAmount: 'not-hex' as Hex,
      },
    };

    expect(() =>
      createNativeTokenAllowanceCaveats({
        permission: invalidPermission,
        contracts,
      }),
    ).toThrow();
  });

  it('rejects zero allowanceAmount', () => {
    expect(() =>
      createNativeTokenAllowanceCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            allowanceAmount: '0x0',
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid native-token-allowance permission: allowanceAmount must be a positive number.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createNativeTokenAllowanceCaveats({
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
      'Invalid native-token-allowance permission: startTime must be a positive number.',
    );
  });

  it('keeps exactCalldata caveat fixed across varied inputs', () => {
    const variedPermission: Populated<NativeTokenAllowancePermission> = {
      ...permission,
      data: {
        ...permission.data,
        allowanceAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        startTime: 1,
      },
    };

    const caveats = createNativeTokenAllowanceCaveats({
      permission: variedPermission,
      contracts,
    });

    expect(caveats[1]?.enforcer).toBe(contracts.exactCalldataEnforcer);
    expect(caveats[1]?.terms).toBe('0x');
  });
});
