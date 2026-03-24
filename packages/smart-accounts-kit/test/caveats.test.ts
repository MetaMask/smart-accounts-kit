import type { Hex } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { randomAddress } from './utils';
import type { SmartAccountsEnvironment } from '../src/types';

const delegationCoreMocks = vi.hoisted(() => ({
  decodeAllowedCalldataTerms: vi.fn(() => ({})),
  decodeAllowedMethodsTerms: vi.fn(() => ({})),
  decodeAllowedTargetsTerms: vi.fn(() => ({})),
  decodeArgsEqualityCheckTerms: vi.fn(() => ({})),
  decodeBlockNumberTerms: vi.fn(() => ({})),
  decodeDeployedTerms: vi.fn(() => ({})),
  decodeERC20BalanceChangeTerms: vi.fn(() => ({})),
  decodeERC20TransferAmountTerms: vi.fn(() => ({})),
  decodeERC20StreamingTerms: vi.fn(() => ({})),
  decodeERC721BalanceChangeTerms: vi.fn(() => ({})),
  decodeERC721TransferTerms: vi.fn(() => ({})),
  decodeERC1155BalanceChangeTerms: vi.fn(() => ({})),
  decodeIdTerms: vi.fn(() => ({})),
  decodeLimitedCallsTerms: vi.fn(() => ({})),
  decodeNonceTerms: vi.fn(() => ({})),
  decodeTimestampTerms: vi.fn(() => ({})),
  decodeValueLteTerms: vi.fn(() => ({})),
  decodeNativeTokenTransferAmountTerms: vi.fn(() => ({})),
  decodeNativeBalanceChangeTerms: vi.fn(() => ({})),
  decodeNativeTokenStreamingTerms: vi.fn(() => ({})),
  decodeNativeTokenPaymentTerms: vi.fn(() => ({})),
  decodeRedeemerTerms: vi.fn(() => ({})),
  decodeSpecificActionERC20TransferBatchTerms: vi.fn(() => ({})),
  decodeERC20TokenPeriodTransferTerms: vi.fn(() => ({})),
  decodeNativeTokenPeriodTransferTerms: vi.fn(() => ({})),
  decodeExactCalldataBatchTerms: vi.fn(() => ({})),
  decodeExactCalldataTerms: vi.fn(() => ({})),
  decodeExactExecutionTerms: vi.fn(() => ({})),
  decodeExactExecutionBatchTerms: vi.fn(() => ({})),
  decodeMultiTokenPeriodTerms: vi.fn(() => ({})),
  decodeOwnershipTransferTerms: vi.fn(() => ({})),
}));

vi.mock('@metamask/delegation-core', () => delegationCoreMocks);

const { decodeCaveat } = await import('../src/caveats');

type DecoderName = keyof typeof delegationCoreMocks;

const DECODE_CASES: {
  enforcerKey: keyof SmartAccountsEnvironment['caveatEnforcers'];
  decoder: DecoderName;
  type: string;
}[] = [
  {
    enforcerKey: 'AllowedCalldataEnforcer',
    decoder: 'decodeAllowedCalldataTerms',
    type: 'allowedCalldata',
  },
  {
    enforcerKey: 'AllowedMethodsEnforcer',
    decoder: 'decodeAllowedMethodsTerms',
    type: 'allowedMethods',
  },
  {
    enforcerKey: 'AllowedTargetsEnforcer',
    decoder: 'decodeAllowedTargetsTerms',
    type: 'allowedTargets',
  },
  {
    enforcerKey: 'ArgsEqualityCheckEnforcer',
    decoder: 'decodeArgsEqualityCheckTerms',
    type: 'argsEqualityCheck',
  },
  {
    enforcerKey: 'BlockNumberEnforcer',
    decoder: 'decodeBlockNumberTerms',
    type: 'blockNumber',
  },
  {
    enforcerKey: 'DeployedEnforcer',
    decoder: 'decodeDeployedTerms',
    type: 'deployed',
  },
  {
    enforcerKey: 'ERC20BalanceChangeEnforcer',
    decoder: 'decodeERC20BalanceChangeTerms',
    type: 'erc20BalanceChange',
  },
  {
    enforcerKey: 'ERC20TransferAmountEnforcer',
    decoder: 'decodeERC20TransferAmountTerms',
    type: 'erc20TransferAmount',
  },
  {
    enforcerKey: 'ERC20StreamingEnforcer',
    decoder: 'decodeERC20StreamingTerms',
    type: 'erc20Streaming',
  },
  {
    enforcerKey: 'ERC721BalanceChangeEnforcer',
    decoder: 'decodeERC721BalanceChangeTerms',
    type: 'erc721BalanceChange',
  },
  {
    enforcerKey: 'ERC721TransferEnforcer',
    decoder: 'decodeERC721TransferTerms',
    type: 'erc721Transfer',
  },
  {
    enforcerKey: 'ERC1155BalanceChangeEnforcer',
    decoder: 'decodeERC1155BalanceChangeTerms',
    type: 'erc1155BalanceChange',
  },
  {
    enforcerKey: 'IdEnforcer',
    decoder: 'decodeIdTerms',
    type: 'id',
  },
  {
    enforcerKey: 'LimitedCallsEnforcer',
    decoder: 'decodeLimitedCallsTerms',
    type: 'limitedCalls',
  },
  {
    enforcerKey: 'NonceEnforcer',
    decoder: 'decodeNonceTerms',
    type: 'nonce',
  },
  {
    enforcerKey: 'TimestampEnforcer',
    decoder: 'decodeTimestampTerms',
    type: 'timestamp',
  },
  {
    enforcerKey: 'ValueLteEnforcer',
    decoder: 'decodeValueLteTerms',
    type: 'valueLte',
  },
  {
    enforcerKey: 'NativeTokenTransferAmountEnforcer',
    decoder: 'decodeNativeTokenTransferAmountTerms',
    type: 'nativeTokenTransferAmount',
  },
  {
    enforcerKey: 'NativeBalanceChangeEnforcer',
    decoder: 'decodeNativeBalanceChangeTerms',
    type: 'nativeBalanceChange',
  },
  {
    enforcerKey: 'NativeTokenStreamingEnforcer',
    decoder: 'decodeNativeTokenStreamingTerms',
    type: 'nativeTokenStreaming',
  },
  {
    enforcerKey: 'NativeTokenPaymentEnforcer',
    decoder: 'decodeNativeTokenPaymentTerms',
    type: 'nativeTokenPayment',
  },
  {
    enforcerKey: 'RedeemerEnforcer',
    decoder: 'decodeRedeemerTerms',
    type: 'redeemer',
  },
  {
    enforcerKey: 'SpecificActionERC20TransferBatchEnforcer',
    decoder: 'decodeSpecificActionERC20TransferBatchTerms',
    type: 'specificActionERC20TransferBatch',
  },
  {
    enforcerKey: 'ERC20PeriodTransferEnforcer',
    decoder: 'decodeERC20TokenPeriodTransferTerms',
    type: 'erc20PeriodTransfer',
  },
  {
    enforcerKey: 'NativeTokenPeriodTransferEnforcer',
    decoder: 'decodeNativeTokenPeriodTransferTerms',
    type: 'nativeTokenPeriodTransfer',
  },
  {
    enforcerKey: 'ExactCalldataBatchEnforcer',
    decoder: 'decodeExactCalldataBatchTerms',
    type: 'exactCalldataBatch',
  },
  {
    enforcerKey: 'ExactCalldataEnforcer',
    decoder: 'decodeExactCalldataTerms',
    type: 'exactCalldata',
  },
  {
    enforcerKey: 'ExactExecutionEnforcer',
    decoder: 'decodeExactExecutionTerms',
    type: 'exactExecution',
  },
  {
    enforcerKey: 'ExactExecutionBatchEnforcer',
    decoder: 'decodeExactExecutionBatchTerms',
    type: 'exactExecutionBatch',
  },
  {
    enforcerKey: 'MultiTokenPeriodEnforcer',
    decoder: 'decodeMultiTokenPeriodTerms',
    type: 'multiTokenPeriod',
  },
  {
    enforcerKey: 'OwnershipTransferEnforcer',
    decoder: 'decodeOwnershipTransferTerms',
    type: 'ownershipTransfer',
  },
];

/**
 * Minimal {@link SmartAccountsEnvironment} for `decodeCaveat` tests (only
 * `caveatEnforcers` is read by the implementation).
 *
 * @param caveatEnforcers - Enforcer name to contract address map.
 * @returns A stub environment suitable for `decodeCaveat`.
 */
function buildEnvironment(
  caveatEnforcers: SmartAccountsEnvironment['caveatEnforcers'],
): SmartAccountsEnvironment {
  return {
    DelegationManager: randomAddress(),
    EntryPoint: randomAddress(),
    SimpleFactory: randomAddress(),
    implementations: {},
    caveatEnforcers,
  };
}

describe('decodeCaveat', () => {
  const terms = '0xabcd' as Hex;

  beforeEach(() => {
    for (const mock of Object.values(delegationCoreMocks)) {
      mock.mockReset();
      mock.mockReturnValue({});
    }
  });

  it.each(DECODE_CASES)(
    'routes $enforcerKey to $decoder and sets type $type',
    ({ enforcerKey, decoder, type }) => {
      const enforcerAddress = randomAddress();
      const decodedPayload = { fromMock: enforcerKey };
      delegationCoreMocks[decoder].mockReturnValue(decodedPayload);

      const environment = buildEnvironment({
        [enforcerKey]: enforcerAddress,
      });

      const result = decodeCaveat({
        caveat: {
          enforcer: enforcerAddress,
          terms,
          args: '0x',
        },
        environment,
      });

      expect(delegationCoreMocks[decoder]).toHaveBeenCalledTimes(1);
      expect(delegationCoreMocks[decoder]).toHaveBeenCalledWith(terms);
      expect(result).toEqual({ type, ...decodedPayload });
    },
  );

  it('throws when the enforcer address is unknown', () => {
    const unknownEnforcer = randomAddress();
    const environment = buildEnvironment({
      AllowedCalldataEnforcer: randomAddress(),
    });

    expect(() =>
      decodeCaveat({
        caveat: {
          enforcer: unknownEnforcer,
          terms,
          args: '0x',
        },
        environment,
      }),
    ).toThrow(`Unknown enforcer address: ${unknownEnforcer}`);
  });
});
