import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import { makeErc20TokenPeriodicDecoderConfig } from '../../../src/permissions/caveats/erc20TokenPeriodic';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { erc20PayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  MAX_PERIOD_DURATION,
  ZERO_32_BYTES,
} from '../../../src/permissions/utils';
import { toWord } from '../../test-utils';

describe('erc20-token-periodic decoder config', () => {
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
      enforcer: erc20PeriodicEnforcer,
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
