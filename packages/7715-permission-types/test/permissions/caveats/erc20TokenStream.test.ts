import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import { makeErc20TokenStreamDecoderConfig } from '../../../src/permissions/caveats/erc20TokenStream';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { erc20PayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  ZERO_32_BYTES,
} from '../../../src/permissions/utils';
import { toWord } from '../../test-utils';

describe('erc20-token-stream decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const {
    timestampEnforcer,
    erc20StreamingEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = getChecksumEnforcersByChainId(contracts);
  const decoder = makeErc20TokenStreamDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );
  const TOKEN_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hex;
  const START_TIME = 1715664;
  const makeTerms = ({
    tokenAddress = TOKEN_ADDRESS,
    initialAmount = 10n,
    maxAmount = 100n,
    amountPerSecond = 5n,
    startTime = START_TIME,
  }: {
    tokenAddress?: Hex;
    initialAmount?: bigint;
    maxAmount?: bigint;
    amountPerSecond?: bigint;
    startTime?: number;
  }): Hex =>
    `0x${tokenAddress.slice(2)}${toWord(initialAmount)}${toWord(maxAmount)}${toWord(
      amountPerSecond,
    )}${toWord(startTime)}` as Hex;

  const makeCaveats = (
    erc20StreamingTerms: Hex,
    valueLteTerms: Hex = ZERO_32_BYTES,
  ): ChecksumCaveat[] => [
    {
      enforcer: erc20StreamingEnforcer,
      terms: erc20StreamingTerms,
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
        [erc20StreamingEnforcer]: 1,
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

    it('validateAndDecodeData decodes valid stream terms', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({})),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        tokenAddress: TOKEN_ADDRESS,
        initialAmount: bigIntToHex(10n),
        maxAmount: bigIntToHex(100n),
        amountPerSecond: bigIntToHex(5n),
        startTime: START_TIME,
      });
    });

    it('validateAndDecodeData rejects non-zero value-lte terms', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(makeTerms({}), `0x${'0'.repeat(63)}1` as Hex),
          decoder.contractAddresses,
        ),
      ).toThrow(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
    });

    it('validateAndDecodeData rejects when maxAmount equals initialAmount', () => {
      const invalidTerms = makeTerms({
        initialAmount: 100n,
        maxAmount: 100n,
      });

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-stream terms: maxAmount must be greater than initialAmount',
      );
    });

    it('validateAndDecodeData rejects when amountPerSecond is zero', () => {
      const invalidTerms = makeTerms({ amountPerSecond: 0n });

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-stream terms: amountPerSecond must be a positive number',
      );
    });

    it('validateAndDecodeData rejects when startTime is zero', () => {
      const invalidTerms = makeTerms({ startTime: 0 });

      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats(invalidTerms),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid erc20-token-stream terms: startTime must be a positive number',
      );
    });
  });
});
