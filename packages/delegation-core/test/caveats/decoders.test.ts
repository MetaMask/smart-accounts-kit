import { describe, it, expect } from 'vitest';

import {
  createValueLteTerms,
  decodeValueLteTerms,
  createTimestampTerms,
  decodeTimestampTerms,
  createBlockNumberTerms,
  decodeBlockNumberTerms,
  createLimitedCallsTerms,
  decodeLimitedCallsTerms,
  createIdTerms,
  decodeIdTerms,
  createNonceTerms,
  decodeNonceTerms,
  createAllowedMethodsTerms,
  decodeAllowedMethodsTerms,
  createAllowedTargetsTerms,
  decodeAllowedTargetsTerms,
  createRedeemerTerms,
  decodeRedeemerTerms,
  createAllowedCalldataTerms,
  decodeAllowedCalldataTerms,
  createArgsEqualityCheckTerms,
  decodeArgsEqualityCheckTerms,
  createExactCalldataTerms,
  decodeExactCalldataTerms,
  createExactExecutionTerms,
  decodeExactExecutionTerms,
  createExactCalldataBatchTerms,
  decodeExactCalldataBatchTerms,
  createExactExecutionBatchTerms,
  decodeExactExecutionBatchTerms,
  createNativeTokenTransferAmountTerms,
  decodeNativeTokenTransferAmountTerms,
  createNativeTokenPaymentTerms,
  decodeNativeTokenPaymentTerms,
  createNativeBalanceChangeTerms,
  decodeNativeBalanceChangeTerms,
  createNativeTokenPeriodTransferTerms,
  decodeNativeTokenPeriodTransferTerms,
  createNativeTokenStreamingTerms,
  decodeNativeTokenStreamingTerms,
  createERC20TransferAmountTerms,
  decodeERC20TransferAmountTerms,
  createERC20BalanceChangeTerms,
  decodeERC20BalanceChangeTerms,
  createERC20TokenPeriodTransferTerms,
  decodeERC20TokenPeriodTransferTerms,
  createERC20StreamingTerms,
  decodeERC20StreamingTerms,
  createERC721TransferTerms,
  decodeERC721TransferTerms,
  createERC721BalanceChangeTerms,
  decodeERC721BalanceChangeTerms,
  createERC1155BalanceChangeTerms,
  decodeERC1155BalanceChangeTerms,
  createDeployedTerms,
  decodeDeployedTerms,
  createOwnershipTransferTerms,
  decodeOwnershipTransferTerms,
  createMultiTokenPeriodTerms,
  decodeMultiTokenPeriodTerms,
  createSpecificActionERC20TransferBatchTerms,
  decodeSpecificActionERC20TransferBatchTerms,
} from '../../src/caveats';

describe('Terms Decoders', () => {
  describe('decodeValueLteTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { maxValue: 1000000000000000000n };
      const encoded = createValueLteTerms(original);
      const decoded = decodeValueLteTerms(encoded);
      expect(decoded).toEqual(original);
    });

    it('decodes zero value', () => {
      const original = { maxValue: 0n };
      const encoded = createValueLteTerms(original);
      const decoded = decodeValueLteTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeTimestampTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        afterThreshold: 1640995200,
        beforeThreshold: 1672531200,
      };
      const encoded = createTimestampTerms(original);
      const decoded = decodeTimestampTerms(encoded);
      expect(decoded).toEqual(original);
    });

    it('decodes zero thresholds', () => {
      const original = {
        afterThreshold: 0,
        beforeThreshold: 0,
      };
      const encoded = createTimestampTerms(original);
      const decoded = decodeTimestampTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeBlockNumberTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { afterThreshold: 100n, beforeThreshold: 200n };
      const encoded = createBlockNumberTerms(original);
      const decoded = decodeBlockNumberTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeLimitedCallsTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { limit: 5 };
      const encoded = createLimitedCallsTerms(original);
      const decoded = decodeLimitedCallsTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeIdTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { id: 12345n };
      const encoded = createIdTerms(original);
      const decoded = decodeIdTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeNonceTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { nonce: '0x1234' as `0x${string}` };
      const encoded = createNonceTerms(original);
      const decoded = decodeNonceTerms(encoded);
      expect(decoded.nonce).toEqual(encoded);
    });
  });

  describe('decodeAllowedMethodsTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        selectors: ['0x70a08231', '0xa9059cbb'] as `0x${string}`[],
      };
      const encoded = createAllowedMethodsTerms(original);
      const decoded = decodeAllowedMethodsTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeAllowedTargetsTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        targets: [
          '0x1234567890123456789012345678901234567890',
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        ] as `0x${string}`[],
      };
      const encoded = createAllowedTargetsTerms(original);
      const decoded = decodeAllowedTargetsTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeRedeemerTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        redeemers: [
          '0x1234567890123456789012345678901234567890',
        ] as `0x${string}`[],
      };
      const encoded = createRedeemerTerms(original);
      const decoded = decodeRedeemerTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeAllowedCalldataTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { startIndex: 4, value: '0x1234' as `0x${string}` };
      const encoded = createAllowedCalldataTerms(original);
      const decoded = decodeAllowedCalldataTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeArgsEqualityCheckTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { args: '0x1234567890abcdef' as `0x${string}` };
      const encoded = createArgsEqualityCheckTerms(original);
      const decoded = decodeArgsEqualityCheckTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeExactCalldataTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        calldata: '0x70a08231000000000000000000000000' as `0x${string}`,
      };
      const encoded = createExactCalldataTerms(original);
      const decoded = decodeExactCalldataTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeExactExecutionTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        execution: {
          target: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          value: 1000n,
          callData: '0x70a08231' as `0x${string}`,
        },
      };
      const encoded = createExactExecutionTerms(original);
      const decoded = decodeExactExecutionTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeExactCalldataBatchTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        executions: [
          {
            target:
              '0x1234567890123456789012345678901234567890' as `0x${string}`,
            value: 1000n,
            callData: '0x70a08231' as `0x${string}`,
          },
          {
            target:
              '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
            value: 2000n,
            callData: '0xa9059cbb' as `0x${string}`,
          },
        ],
      };
      const encoded = createExactCalldataBatchTerms(original);
      const decoded = decodeExactCalldataBatchTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeExactExecutionBatchTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        executions: [
          {
            target:
              '0x1234567890123456789012345678901234567890' as `0x${string}`,
            value: 1000n,
            callData: '0x70a08231' as `0x${string}`,
          },
        ],
      };
      const encoded = createExactExecutionBatchTerms(original);
      const decoded = decodeExactExecutionBatchTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeNativeTokenTransferAmountTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = { maxAmount: 1000000000000000000n };
      const encoded = createNativeTokenTransferAmountTerms(original);
      const decoded = decodeNativeTokenTransferAmountTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeNativeTokenPaymentTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        recipient:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        amount: 1000000000000000000n,
      };
      const encoded = createNativeTokenPaymentTerms(original);
      const decoded = decodeNativeTokenPaymentTerms(encoded);
      expect((decoded.recipient as string).toLowerCase()).toEqual(
        original.recipient.toLowerCase(),
      );
      expect(decoded.amount).toEqual(original.amount);
    });
  });

  describe('decodeNativeBalanceChangeTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        recipient:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        balance: 1000000000000000000n,
        changeType: 0,
      };
      const encoded = createNativeBalanceChangeTerms(original);
      const decoded = decodeNativeBalanceChangeTerms(encoded);
      expect((decoded.recipient as string).toLowerCase()).toEqual(
        original.recipient.toLowerCase(),
      );
      expect(decoded.balance).toEqual(original.balance);
      expect(decoded.changeType).toEqual(original.changeType);
    });
  });

  describe('decodeNativeTokenPeriodTransferTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        periodAmount: 1000000000000000000n,
        periodDuration: 86400,
        startDate: 1640995200,
      };
      const encoded = createNativeTokenPeriodTransferTerms(original);
      const decoded = decodeNativeTokenPeriodTransferTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeNativeTokenStreamingTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 1000000000000000n,
        startTime: 1640995200,
      };
      const encoded = createNativeTokenStreamingTerms(original);
      const decoded = decodeNativeTokenStreamingTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeERC20TransferAmountTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        maxAmount: 1000000000000000000n,
      };
      const encoded = createERC20TransferAmountTerms(original);
      const decoded = decodeERC20TransferAmountTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeERC20BalanceChangeTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        recipient:
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        balance: 1000000000000000000n,
        changeType: 0,
      };
      const encoded = createERC20BalanceChangeTerms(original);
      const decoded = decodeERC20BalanceChangeTerms(encoded);
      expect((decoded.tokenAddress as string).toLowerCase()).toEqual(
        original.tokenAddress.toLowerCase(),
      );
      expect((decoded.recipient as string).toLowerCase()).toEqual(
        original.recipient.toLowerCase(),
      );
      expect(decoded.balance).toEqual(original.balance);
      expect(decoded.changeType).toEqual(original.changeType);
    });
  });

  describe('decodeERC20TokenPeriodTransferTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        periodAmount: 1000000000000000000n,
        periodDuration: 86400,
        startDate: 1640995200,
      };
      const encoded = createERC20TokenPeriodTransferTerms(original);
      const decoded = decodeERC20TokenPeriodTransferTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeERC20StreamingTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        initialAmount: 1000000000000000000n,
        maxAmount: 10000000000000000000n,
        amountPerSecond: 1000000000000000n,
        startTime: 1640995200,
      };
      const encoded = createERC20StreamingTerms(original);
      const decoded = decodeERC20StreamingTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeERC721TransferTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        tokenId: 123n,
      };
      const encoded = createERC721TransferTerms(original);
      const decoded = decodeERC721TransferTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeERC721BalanceChangeTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        recipient:
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        amount: 5n,
        changeType: 0,
      };
      const encoded = createERC721BalanceChangeTerms(original);
      const decoded = decodeERC721BalanceChangeTerms(encoded);
      expect((decoded.tokenAddress as string).toLowerCase()).toEqual(
        original.tokenAddress.toLowerCase(),
      );
      expect((decoded.recipient as string).toLowerCase()).toEqual(
        original.recipient.toLowerCase(),
      );
      expect(decoded.amount).toEqual(original.amount);
      expect(decoded.changeType).toEqual(original.changeType);
    });
  });

  describe('decodeERC1155BalanceChangeTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        recipient:
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        tokenId: 123n,
        balance: 1000n,
        changeType: 0,
      };
      const encoded = createERC1155BalanceChangeTerms(original);
      const decoded = decodeERC1155BalanceChangeTerms(encoded);
      expect((decoded.tokenAddress as string).toLowerCase()).toEqual(
        original.tokenAddress.toLowerCase(),
      );
      expect((decoded.recipient as string).toLowerCase()).toEqual(
        original.recipient.toLowerCase(),
      );
      expect(decoded.tokenId).toEqual(original.tokenId);
      expect(decoded.balance).toEqual(original.balance);
      expect(decoded.changeType).toEqual(original.changeType);
    });
  });

  describe('decodeDeployedTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        contractAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        salt: '0x1234' as `0x${string}`,
        bytecode: '0x608060405234801561001057600080fd5b50' as `0x${string}`,
      };
      const encoded = createDeployedTerms(original);
      const decoded = decodeDeployedTerms(encoded);
      expect(decoded.contractAddress).toEqual(original.contractAddress);
      expect((decoded.salt as string).toLowerCase()).toEqual(
        '0x0000000000000000000000000000000000000000000000000000000000001234',
      );
      expect(decoded.bytecode).toEqual(original.bytecode);
    });
  });

  describe('decodeOwnershipTransferTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        contractAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
      };
      const encoded = createOwnershipTransferTerms(original);
      const decoded = decodeOwnershipTransferTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeMultiTokenPeriodTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenConfigs: [
          {
            token:
              '0x1234567890123456789012345678901234567890' as `0x${string}`,
            periodAmount: 1000000000000000000n,
            periodDuration: 86400,
            startDate: 1640995200,
          },
          {
            token:
              '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
            periodAmount: 2000000000000000000n,
            periodDuration: 172800,
            startDate: 1640995200,
          },
        ],
      };
      const encoded = createMultiTokenPeriodTerms(original);
      const decoded = decodeMultiTokenPeriodTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('decodeSpecificActionERC20TransferBatchTerms', () => {
    it('correctly decodes encoded terms', () => {
      const original = {
        tokenAddress:
          '0x1234567890123456789012345678901234567890' as `0x${string}`,
        recipient:
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`,
        amount: 1000000000000000000n,
        target: '0x9876543210987654321098765432109876543210' as `0x${string}`,
        calldata: '0x70a08231' as `0x${string}`,
      };
      const encoded = createSpecificActionERC20TransferBatchTerms(original);
      const decoded = decodeSpecificActionERC20TransferBatchTerms(encoded);
      expect(decoded).toEqual(original);
    });
  });
});
