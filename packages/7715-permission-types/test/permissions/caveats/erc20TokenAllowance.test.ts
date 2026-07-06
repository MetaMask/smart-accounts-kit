import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createErc20TokenAllowanceCaveats,
  makeErc20TokenAllowanceDecoderConfig,
  type Erc20TokenAllowanceEnforcers,
} from '../../../src/permissions/caveats/erc20TokenAllowance';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { erc20PayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  UINT256_MAX,
  ZERO_32_BYTES,
} from '../../../src/permissions/utils';
import type {
  Erc20TokenAllowancePermission,
  Populated,
} from '../../../src/types';
import { toWord } from '../../test-utils';

describe('erc20-token-allowance decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    erc20PeriodicEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeErc20TokenAllowanceDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );
  const TOKEN_ADDRESS_HEX = 'aa'.repeat(20);
  const ALLOWANCE_AMOUNT_HEX = toWord(100n);
  const START_TIME = 1715664;
  const START_TIME_HEX = toWord(START_TIME);
  const VALID_ALLOWANCE_TERMS =
    `0x${TOKEN_ADDRESS_HEX}${ALLOWANCE_AMOUNT_HEX}${UINT256_MAX.slice(2)}${START_TIME_HEX}` as Hex;

  const makeCaveats = (
    erc20PeriodicTerms: Hex,
    valueLteTerms: Hex = ZERO_32_BYTES,
  ): ChecksumCaveat[] => [
    {
      enforcer: erc20PeriodicEnforcer,
      terms: erc20PeriodicTerms,
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
        [erc20PeriodicEnforcer]: 1,
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

    it('validateAndDecodeData decodes valid allowance terms', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(VALID_ALLOWANCE_TERMS),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        tokenAddress: `0x${TOKEN_ADDRESS_HEX}`,
        allowanceAmount: `0x${ALLOWANCE_AMOUNT_HEX}`,
        startTime: START_TIME,
      });
    });

    it('validateAndDecodeData rejects non-zero value-lte terms', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(VALID_ALLOWANCE_TERMS, `0x${'0'.repeat(63)}1` as Hex),
          decoder.contractAddresses,
        ),
      ).toThrow(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
    });

    it('validateAndDecodeData rejects invalid periodDuration', () => {
      const nonMaxDurationHex = toWord(86400);
      const invalidTerms =
        `0x${TOKEN_ADDRESS_HEX}${ALLOWANCE_AMOUNT_HEX}${nonMaxDurationHex}${START_TIME_HEX}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-allowance terms: periodDuration must be UINT256_MAX',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      const invalidTerms =
        `0x${TOKEN_ADDRESS_HEX}${ALLOWANCE_AMOUNT_HEX}${UINT256_MAX.slice(2)}${toWord(0)}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-allowance terms: startTime must be a positive number',
      );
    });

    it('validateAndDecodeData rejects zero allowanceAmount', () => {
      const zeroAllowanceAmount = '0'.repeat(64);
      const invalidTerms =
        `0x${TOKEN_ADDRESS_HEX}${zeroAllowanceAmount}${UINT256_MAX.slice(2)}${START_TIME_HEX}` as Hex;

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-allowance terms: allowanceAmount must be a positive number',
      );
    });
  });
});

describe('createErc20TokenAllowanceCaveats()', () => {
  const tokenAddress = '0x1234567890123456789012345678901234567890' as const;
  const allowanceAmount = '0x64' as const;
  const startTime = 1729900800;

  const contracts: Erc20TokenAllowanceEnforcers = {
    erc20PeriodicEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    valueLteEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const permission: Populated<Erc20TokenAllowancePermission> = {
    type: 'erc20-token-allowance',
    data: {
      tokenAddress,
      allowanceAmount,
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates erc20Periodic and valueLte caveats', () => {
    const caveats = createErc20TokenAllowanceCaveats({
      permission,
      contracts,
    });
    const expectedTerms = `0x${tokenAddress.slice(2)}${toWord(BigInt(allowanceAmount))}${UINT256_MAX.slice(2)}${toWord(startTime)}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.erc20PeriodicEnforcer,
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
        allowanceAmount: 'not-hex' as Hex,
      },
    };

    expect(() =>
      createErc20TokenAllowanceCaveats({
        permission: invalidPermission,
        contracts,
      }),
    ).toThrow();
  });

  it('rejects zero allowanceAmount', () => {
    expect(() =>
      createErc20TokenAllowanceCaveats({
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
      'Invalid erc20-token-allowance permission: allowanceAmount must be a positive number.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createErc20TokenAllowanceCaveats({
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
      'Invalid erc20-token-allowance permission: startTime must be a positive number.',
    );
  });

  it('keeps valueLte caveat fixed at zero across varied inputs', () => {
    const variedPermission: Populated<Erc20TokenAllowancePermission> = {
      ...permission,
      data: {
        ...permission.data,
        tokenAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        allowanceAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        startTime: 1,
      },
    };

    const caveats = createErc20TokenAllowanceCaveats({
      permission: variedPermission,
      contracts,
    });

    expect(caveats[1]?.enforcer).toBe(contracts.valueLteEnforcer);
    expect(caveats[1]?.terms).toBe(ZERO_32_BYTES);
  });

  it('encodes provided token address in allowance terms', () => {
    const alternateTokenAddress =
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hex;
    const permissionWithAltToken = {
      ...permission,
      data: {
        ...permission.data,
        tokenAddress: alternateTokenAddress,
      },
    };

    const caveats = createErc20TokenAllowanceCaveats({
      permission: permissionWithAltToken,
      contracts,
    });
    const erc20AllowanceTerms = caveats[0]?.terms as Hex;

    expect(caveats[0]?.enforcer).toBe(contracts.erc20PeriodicEnforcer);
    expect(
      erc20AllowanceTerms.startsWith(`0x${alternateTokenAddress.slice(2)}`),
    ).toBe(true);
  });
});
