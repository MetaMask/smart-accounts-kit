import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { bigIntToHex, type Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createErc20TokenStreamCaveats,
  type Erc20TokenStreamEnforcers,
  makeErc20TokenStreamDecoderConfig,
} from '../../../src/permissions/caveats/erc20TokenStream';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import { erc20PayeeRuleDecoder } from '../../../src/permissions/rules/payee';
import { redeemerRuleDecoder } from '../../../src/permissions/rules/redeemer';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import {
  getChecksumEnforcersByChainId,
  ZERO_32_BYTES,
} from '../../../src/permissions/utils';
import type { Erc20TokenStreamPermission, Populated } from '../../../src/types';
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

describe('createErc20TokenStreamCaveats()', () => {
  const initialAmount = '0x0de0b6b3a7640000' as const;
  const maxAmount = '0x8ac7230489e80000' as const;
  const amountPerSecond = '0x06f05b59d3b20000' as const;
  const startTime = 1729900800; // 10/26/2024 00:00:00 UTC
  const tokenAddress = '0x1234567890123456789012345678901234567890' as const;

  const contracts: Erc20TokenStreamEnforcers = {
    erc20StreamingEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
    valueLteEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
  };

  const mockPermission: Populated<Erc20TokenStreamPermission> = {
    type: 'erc20-token-stream',
    data: {
      initialAmount,
      maxAmount,
      amountPerSecond,
      startTime,
      tokenAddress,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates erc20Streaming and valueLte caveats', () => {
    const caveats = createErc20TokenStreamCaveats({
      permission: mockPermission,
      contracts,
    });
    const initialAmountHex = initialAmount.slice(2).padStart(64, '0');
    const maxAmountHex = maxAmount.slice(2).padStart(64, '0');
    const amountPerSecondHex = amountPerSecond.slice(2).padStart(64, '0');
    const startTimeHex = startTime.toString(16).padStart(64, '0');
    const erc20StreamingExpectedTerms = `0x${tokenAddress.slice(2)}${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.erc20StreamingEnforcer,
        terms: erc20StreamingExpectedTerms,
        args: '0x',
      },
      {
        enforcer: contracts.valueLteEnforcer,
        terms:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        args: '0x',
      },
    ]);
  });

  it('rejects malformed numeric hex input', () => {
    const invalidPermission = {
      ...mockPermission,
      data: {
        ...mockPermission.data,
        initialAmount: 'not-hex' as Hex,
      },
    };

    expect(() =>
      createErc20TokenStreamCaveats({
        permission: invalidPermission,
        contracts,
      }),
    ).toThrow();
  });

  it('rejects when maxAmount equals initialAmount', () => {
    expect(() =>
      createErc20TokenStreamCaveats({
        permission: {
          ...mockPermission,
          data: {
            ...mockPermission.data,
            initialAmount: '0x64',
            maxAmount: '0x64',
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid erc20-token-stream permission: maxAmount must be greater than initialAmount.',
    );
  });

  it('rejects when amountPerSecond is zero', () => {
    expect(() =>
      createErc20TokenStreamCaveats({
        permission: {
          ...mockPermission,
          data: {
            ...mockPermission.data,
            amountPerSecond: '0x0',
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid erc20-token-stream permission: amountPerSecond must be a positive number.',
    );
  });

  it('rejects when startTime is zero', () => {
    expect(() =>
      createErc20TokenStreamCaveats({
        permission: {
          ...mockPermission,
          data: {
            ...mockPermission.data,
            startTime: 0,
          },
        },
        contracts,
      }),
    ).toThrow(
      'Invalid erc20-token-stream permission: startTime must be a positive number.',
    );
  });

  it('keeps valueLte caveat fixed at zero across varied inputs', () => {
    const variedPermission: Populated<Erc20TokenStreamPermission> = {
      ...mockPermission,
      data: {
        ...mockPermission.data,
        tokenAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        initialAmount: '0x1',
        maxAmount:
          '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        amountPerSecond: '0x2',
        startTime: 1,
      },
    };

    const caveats = createErc20TokenStreamCaveats({
      permission: variedPermission,
      contracts,
    });

    expect(caveats[1]?.enforcer).toBe(contracts.valueLteEnforcer);
    expect(caveats[1]?.terms).toBe(ZERO_32_BYTES);
  });

  it('encodes provided token address in stream terms', () => {
    const alternateTokenAddress =
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hex;
    const permission = {
      ...mockPermission,
      data: {
        ...mockPermission.data,
        tokenAddress: alternateTokenAddress,
      },
    };

    const caveats = createErc20TokenStreamCaveats({
      permission,
      contracts,
    });
    const erc20StreamingTerms = caveats[0]?.terms as Hex;

    expect(caveats[0]?.enforcer).toBe(contracts.erc20StreamingEnforcer);
    expect(
      erc20StreamingTerms.startsWith(`0x${alternateTokenAddress.slice(2)}`),
    ).toBe(true);
  });
});
