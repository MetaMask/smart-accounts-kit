import { createTimestampTerms } from '@metamask/delegation-core';
import { bigIntToHex, type Hex } from '@metamask/utils';
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
import { startTimeRuleDecoder } from '../../../src/permissions/rules/startTime';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { checksumEnforcerAddresses } from '../../../src/permissions/utils';
import type {
  NativeTokenAllowancePermission,
  Populated,
} from '../../../src/types';
import { contracts, toWord } from '../../test-utils';

describe('native-token-allowance decoder config', () => {
  const enforcers = checksumEnforcerAddresses(contracts);
  const {
    timestampEnforcer,
    nativeTokenTransferAmountEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = enforcers;
  const decoder = makeNativeTokenAllowanceDecoderConfig(enforcers);

  const ALLOWANCE_AMOUNT_HEX = toWord(100n);
  const START_TIME = 1715664;
  const VALID_ALLOWANCE_TERMS = `0x${ALLOWANCE_AMOUNT_HEX}`;
  const VALID_TIMESTAMP_TERMS = createTimestampTerms({
    afterThreshold: START_TIME,
    beforeThreshold: 0,
  });

  const makeCaveats = (
    nativeTokenTransferAmountTerms: Hex,
    exactCalldataTerms: Hex = '0x',
    timestampTerms: Hex = VALID_TIMESTAMP_TERMS,
  ): ChecksumCaveat[] => [
    {
      enforcer: nativeTokenTransferAmountEnforcer,
      terms: nativeTokenTransferAmountTerms,
      args: '0x',
    },
    {
      enforcer: exactCalldataEnforcer,
      terms: exactCalldataTerms,
      args: '0x',
    },
    {
      enforcer: timestampEnforcer,
      terms: timestampTerms,
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
        [nativeTokenTransferAmountEnforcer]: 1,
        [exactCalldataEnforcer]: 1,
        [timestampEnforcer]: 1,
        [nonceEnforcer]: 1,
      });
    });

    it('exposes expected optional enforcers', () => {
      expect(decoder.optionalEnforcers).toStrictEqual([
        redeemerEnforcer,
        allowedTargetsEnforcer,
      ]);
    });

    it('includes expected rule decoders in order', () => {
      expect(decoder.rules).toStrictEqual([
        expiryRuleDecoder,
        startTimeRuleDecoder,
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
        allowanceAmount: bigIntToHex(100n),
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

    it('validateAndDecodeData rejects terms with unexpected length', () => {
      const invalidTerms = `0x${ALLOWANCE_AMOUNT_HEX}00` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid NativeTokenTransferAmount terms: must be exactly 32 bytes',
      );
    });

    it('validateAndDecodeData rejects zero allowanceAmount', () => {
      const zeroAllowanceAmount = '0'.repeat(64);
      const invalidTerms = `0x${zeroAllowanceAmount}`;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-allowance terms: allowanceAmount must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      const zeroStartTimeTerms = createTimestampTerms({
        afterThreshold: 0,
        beforeThreshold: 0,
      });

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(VALID_ALLOWANCE_TERMS, '0x', zeroStartTimeTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-allowance terms: startTime must be a positive number',
      );
    });
  });
});

describe('createNativeTokenAllowanceCaveats()', () => {
  const allowanceAmount = '0x64' as const;
  const startTime = 1729900800;

  const enforcers: NativeTokenAllowanceEnforcers = {
    nativeTokenTransferAmountEnforcer:
      '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    exactCalldataEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
    timestampEnforcer: '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3',
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

  it('creates nativeTokenTransferAmount, exactCalldata, and timestamp caveats', () => {
    const caveats = createNativeTokenAllowanceCaveats({
      permission,
      contracts: enforcers,
    });
    const expectedTerms = `0x${toWord(BigInt(allowanceAmount))}`;
    const expectedTimestampTerms = createTimestampTerms({
      afterThreshold: startTime,
      beforeThreshold: 0,
    });

    expect(caveats).toStrictEqual([
      {
        enforcer: enforcers.nativeTokenTransferAmountEnforcer,
        terms: expectedTerms,
        args: '0x',
      },
      {
        enforcer: enforcers.exactCalldataEnforcer,
        terms: '0x',
        args: '0x',
      },
      {
        enforcer: enforcers.timestampEnforcer,
        terms: expectedTimestampTerms,
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
        contracts: enforcers,
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
        contracts: enforcers,
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
        contracts: enforcers,
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
      contracts: enforcers,
    });

    expect(caveats[1]?.enforcer).toBe(enforcers.exactCalldataEnforcer);
    expect(caveats[1]?.terms).toBe('0x');
  });
});
