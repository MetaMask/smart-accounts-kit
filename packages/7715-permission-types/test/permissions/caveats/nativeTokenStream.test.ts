import { bigIntToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createNativeTokenStreamCaveats,
  makeNativeTokenStreamDecoderConfig,
} from '../../../src/permissions/caveats/nativeTokenStream';
import type { NativeTokenStreamEnforcers } from '../../../src/permissions/caveats/nativeTokenStream';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { nativePayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { checksumEnforcerAddresses } from '../../../src/permissions/utils';
import type {
  NativeTokenStreamPermission,
  Populated,
} from '../../../src/types';
import { contracts, toWord } from '../../test-utils';

describe('native-token-stream decoder config', () => {
  const enforcers = checksumEnforcerAddresses(contracts);
  const {
    timestampEnforcer,
    nativeTokenStreamingEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = enforcers;
  const decoder = makeNativeTokenStreamDecoderConfig(enforcers);
  const START_TIME = 1715664;
  const makeTerms = ({
    initialAmount = 10n,
    maxAmount = 100n,
    amountPerSecond = 5n,
    startTime = START_TIME,
  }: {
    initialAmount?: bigint;
    maxAmount?: bigint;
    amountPerSecond?: bigint;
    startTime?: number;
  }): Hex => {
    return `0x${toWord(initialAmount)}${toWord(maxAmount)}${toWord(amountPerSecond)}${toWord(startTime)}` as Hex;
  };

  const makeCaveats = (
    nativeTokenStreamingTerms: Hex,
    exactCalldataTerms: Hex = '0x',
  ): ChecksumCaveat[] => [
    {
      enforcer: nativeTokenStreamingEnforcer,
      terms: nativeTokenStreamingTerms,
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
        [nativeTokenStreamingEnforcer]: 1,
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

    it('validateAndDecodeData decodes valid stream terms', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({})),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        initialAmount: bigIntToHex(10n),
        maxAmount: bigIntToHex(100n),
        amountPerSecond: bigIntToHex(5n),
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

    it('validateAndDecodeData rejects when maxAmount equals initialAmount', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ initialAmount: 100n, maxAmount: 100n })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-stream terms: maxAmount must be greater than initialAmount',
      );
    });

    it('validateAndDecodeData rejects when amountPerSecond is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ amountPerSecond: 0n })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-stream terms: amountPerSecond must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({ startTime: 0 })),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid native-token-stream terms: startTime must be a positive number',
      );
    });
  });
});

describe('createNativeTokenStreamCaveats()', () => {
  const initialAmount = '0x0de0b6b3a7640000' as const;
  const maxAmount = '0x8ac7230489e80000' as const;
  const amountPerSecond = '0x06f05b59d3b20000' as const;
  const startTime = 1729900800;

  const enforcers: NativeTokenStreamEnforcers = {
    nativeTokenStreamingEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    exactCalldataEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const permission: Populated<NativeTokenStreamPermission> = {
    type: 'native-token-stream',
    data: {
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates nativeTokenStreaming and exactCalldata caveats', () => {
    const caveats = createNativeTokenStreamCaveats({
      permission,
      contracts: enforcers,
    });

    const initialAmountHex = initialAmount.slice(2).padStart(64, '0');
    const maxAmountHex = maxAmount.slice(2).padStart(64, '0');
    const amountPerSecondHex = amountPerSecond.slice(2).padStart(64, '0');
    const startTimeHex = toWord(startTime);
    const nativeTokenStreamingExpectedTerms = `0x${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: enforcers.nativeTokenStreamingEnforcer,
        terms: nativeTokenStreamingExpectedTerms,
        args: '0x',
      },
      {
        enforcer: enforcers.exactCalldataEnforcer,
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
        initialAmount: 'not-hex' as Hex,
      },
    };

    expect(() =>
      createNativeTokenStreamCaveats({
        permission: invalidPermission,
        contracts: enforcers,
      }),
    ).toThrow();
  });

  it('rejects when maxAmount equals initialAmount', () => {
    expect(() =>
      createNativeTokenStreamCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            initialAmount: '0x64',
            maxAmount: '0x64',
          },
        },
        contracts: enforcers,
      }),
    ).toThrow(
      'Invalid native-token-stream permission: maxAmount must be greater than initialAmount.',
    );
  });

  it('rejects when amountPerSecond is zero', () => {
    expect(() =>
      createNativeTokenStreamCaveats({
        permission: {
          ...permission,
          data: {
            ...permission.data,
            amountPerSecond: '0x0',
          },
        },
        contracts: enforcers,
      }),
    ).toThrow(
      'Invalid native-token-stream permission: amountPerSecond must be a positive number.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createNativeTokenStreamCaveats({
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
      'Invalid native-token-stream permission: startTime must be a positive number.',
    );
  });

  it('keeps exactCalldata caveat fixed across varied inputs', () => {
    const variedPermission: Populated<NativeTokenStreamPermission> = {
      ...permission,
      data: {
        ...permission.data,
        initialAmount: '0x1',
        maxAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        amountPerSecond: '0x2',
        startTime: 1,
      },
    };

    const caveats = createNativeTokenStreamCaveats({
      permission: variedPermission,
      contracts: enforcers,
    });

    expect(caveats[1]?.enforcer).toBe(enforcers.exactCalldataEnforcer);
    expect(caveats[1]?.terms).toBe('0x');
  });
});
