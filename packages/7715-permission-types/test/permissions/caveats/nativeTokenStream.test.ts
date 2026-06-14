import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import { makeNativeTokenStreamDecoderConfig } from '../../../src/permissions/caveats/nativeTokenStream';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { nativePayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { getChecksumEnforcersByChainId } from '../../../src/permissions/utils';
import { toWord } from '../../test-utils';

describe('native-token-stream decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    nativeTokenStreamingEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeNativeTokenStreamDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );
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
