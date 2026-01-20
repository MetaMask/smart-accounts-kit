import { isHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';

import { ScopeType } from '../../../src/constants';
import { createDelegation } from '../../../src/delegation';
import * as DelegationManager from '../../../src/DelegationFramework/DelegationManager';
import { ExecutionMode, createExecution } from '../../../src/executions';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('DelegationManager - Delegation Management', () => {
  const environment: SmartAccountsEnvironment = {
    DelegationManager: randomAddress(),
    SimpleFactory: randomAddress(),
    EntryPoint: randomAddress(),
    implementations: {
      HybridDeleGatorImpl: randomAddress(),
      MultiSigDeleGatorImpl: randomAddress(),
      Stateless7702DeleGatorImpl: randomAddress(),
    },
    caveatEnforcers: {
      AllowedTargetsEnforcer: randomAddress(),
      AllowedMethodsEnforcer: randomAddress(),
      AllowedCalldataEnforcer: randomAddress(),
      TimestampEnforcer: randomAddress(),
      BlockNumberEnforcer: randomAddress(),
      NonceEnforcer: randomAddress(),
      LimitedCallsEnforcer: randomAddress(),
      ERC20BalanceChangeEnforcer: randomAddress(),
      ERC20StreamingEnforcer: randomAddress(),
      IdEnforcer: randomAddress(),
      ERC20TransferAmountEnforcer: randomAddress(),
      ValueLteEnforcer: randomAddress(),
      NativeTokenTransferAmountEnforcer: randomAddress(),
      NativeBalanceChangeEnforcer: randomAddress(),
      NativeTokenStreamingEnforcer: randomAddress(),
      NativeTokenPaymentEnforcer: randomAddress(),
      RedeemerEnforcer: randomAddress(),
      ArgsEqualityCheckEnforcer: randomAddress(),
      ERC721BalanceChangeEnforcer: randomAddress(),
      ERC721TransferEnforcer: randomAddress(),
      ERC1155BalanceChangeEnforcer: randomAddress(),
      OwnershipTransferEnforcer: randomAddress(),
      SpecificActionERC20TransferBatchEnforcer: randomAddress(),
      ERC20PeriodTransferEnforcer: randomAddress(),
      NativeTokenPeriodTransferEnforcer: randomAddress(),
      ExactCalldataBatchEnforcer: randomAddress(),
      ExactCalldataEnforcer: randomAddress(),
      ExactExecutionEnforcer: randomAddress(),
      ExactExecutionBatchEnforcer: randomAddress(),
      MultiTokenPeriodEnforcer: randomAddress(),
      DeployedEnforcer: randomAddress(),
    },
  } as SmartAccountsEnvironment;

  describe('API Structure', () => {
    it('should export the correct functions', () => {
      // Read functions
      expect(DelegationManager.read.disabledDelegations).toBeDefined();
      expect(DelegationManager.read.getAnyDelegate).toBeDefined();
      expect(DelegationManager.read.getRootAuthority).toBeDefined();

      // Execute functions
      expect(DelegationManager.execute.disableDelegation).toBeDefined();
      expect(DelegationManager.execute.enableDelegation).toBeDefined();
      expect(DelegationManager.execute.redeemDelegations).toBeDefined();

      // Simulate functions
      expect(DelegationManager.simulate.disableDelegation).toBeDefined();
      expect(DelegationManager.simulate.enableDelegation).toBeDefined();
      expect(DelegationManager.simulate.redeemDelegations).toBeDefined();

      // Encode functions
      expect(DelegationManager.encode.disableDelegation).toBeDefined();
      expect(DelegationManager.encode.enableDelegation).toBeDefined();
      expect(DelegationManager.encode.redeemDelegations).toBeDefined();
    });
  });

  describe('disableDelegation', () => {
    it('should encode disableDelegation correctly', () => {
      const alice = privateKeyToAccount(generatePrivateKey());
      const bob = privateKeyToAccount(generatePrivateKey());

      const delegation = createDelegation({
        to: bob.address,
        from: alice.address,
        environment,
        scope: {
          type: ScopeType.FunctionCall,
          targets: [alice.address],
          selectors: ['0x00000000'],
        },
      });

      const encodedData = DelegationManager.encode.disableDelegation({
        delegation,
      });

      expect(isHex(encodedData, { strict: true })).toBe(true);
      expect(encodedData.length).toBe(1930);
    });
  });

  describe('enableDelegation', () => {
    it('should encode enableDelegation correctly', () => {
      const alice = privateKeyToAccount(generatePrivateKey());
      const bob = privateKeyToAccount(generatePrivateKey());

      const delegation = createDelegation({
        to: bob.address,
        from: alice.address,
        environment,
        scope: {
          type: ScopeType.FunctionCall,
          targets: [alice.address],
          selectors: ['0x00000000'],
        },
      });

      const encodedData = DelegationManager.encode.enableDelegation({
        delegation,
      });

      expect(isHex(encodedData, { strict: true })).toBe(true);
      expect(encodedData.length).toBe(1930);
    });
  });

  describe('redeemDelegations', () => {
    it('should encode redeemDelegations correctly', () => {
      const alice = privateKeyToAccount(generatePrivateKey());
      const bob = privateKeyToAccount(generatePrivateKey());

      const delegation = createDelegation({
        to: bob.address,
        from: alice.address,
        environment,
        scope: {
          type: ScopeType.FunctionCall,
          targets: [alice.address],
          selectors: ['0x00000000'],
        },
      });

      const execution = createExecution({
        target: alice.address,
      });

      const encodedData = DelegationManager.encode.redeemDelegations({
        delegations: [[delegation]],
        modes: [ExecutionMode.SingleDefault],
        executions: [[execution]],
      });

      expect(isHex(encodedData, { strict: true })).toBe(true);
      expect(encodedData.length).toBe(2890);
    });
  });
});
