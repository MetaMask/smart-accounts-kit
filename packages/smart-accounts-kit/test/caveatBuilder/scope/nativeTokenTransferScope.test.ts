import { toHex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createNativeTokenTransferCaveatBuilder } from '../../../src/caveatBuilder/scope/nativeTokenTransferScope';
import type { NativeTokenTransferScopeConfig } from '../../../src/caveatBuilder/scope/nativeTokenTransferScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createNativeTokenTransferCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      ExactCalldataEnforcer: randomAddress(),
      AllowedCalldataEnforcer: randomAddress(),
      NativeTokenTransferAmountEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates a native token transfer CaveatBuilder with default empty calldata', () => {
    const config: NativeTokenTransferScopeConfig = {
      type: ScopeType.NativeTokenTransferAmount,
      maxAmount: 1000n,
    };

    const caveatBuilder = createNativeTokenTransferCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ExactCalldataEnforcer,
        args: '0x00',
        terms: '0x',
      },
      {
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        args: '0x00',
        terms: toHex(config.maxAmount, { size: 32 }),
      },
    ]);
  });

  it('creates a native token transfer CaveatBuilder with exact calldata', () => {
    const config: NativeTokenTransferScopeConfig = {
      type: ScopeType.NativeTokenTransferAmount,
      maxAmount: 1000n,
      exactCalldata: {
        calldata: '0x1234abcd',
      },
    };

    const caveatBuilder = createNativeTokenTransferCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ExactCalldataEnforcer,
        args: '0x00',
        terms: '0x1234abcd',
      },
      {
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        args: '0x00',
        terms: toHex(config.maxAmount, { size: 32 }),
      },
    ]);
  });

  it('creates a native token transfer CaveatBuilder with empty allowedCalldata array (should fall back to default)', () => {
    const config: NativeTokenTransferScopeConfig = {
      type: ScopeType.NativeTokenTransferAmount,
      maxAmount: 1000n,
      allowedCalldata: [], // Empty array should trigger fallback to default exactCalldata
    };

    const caveatBuilder = createNativeTokenTransferCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ExactCalldataEnforcer,
        args: '0x00',
        terms: '0x',
      },
      {
        enforcer: environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
        args: '0x00',
        terms: toHex(config.maxAmount, { size: 32 }),
      },
    ]);
  });

  it('creates a native token transfer CaveatBuilder with allowed calldata', () => {
    const config: NativeTokenTransferScopeConfig = {
      type: ScopeType.NativeTokenTransferAmount,
      maxAmount: 1000n,
      allowedCalldata: [
        {
          startIndex: 4,
          value: '0x1234',
        },
        {
          startIndex: 8,
          value: '0xabcd',
        },
      ],
    };

    const caveatBuilder = createNativeTokenTransferCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.have.lengthOf(3);
    expect(caveats[0]?.enforcer).to.equal(
      environment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveats[1]?.enforcer).to.equal(
      environment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveats[2]?.enforcer).to.equal(
      environment.caveatEnforcers.NativeTokenTransferAmountEnforcer,
    );
  });
});
