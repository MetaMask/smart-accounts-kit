import { concat, toHex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createNativeTokenStreamingCaveatBuilder } from '../../../src/caveatBuilder/scope/nativeTokenStreamingScope';
import type { NativeTokenStreamingScopeConfig } from '../../../src/caveatBuilder/scope/nativeTokenStreamingScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createNativeTokenStreamingCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      ExactCalldataEnforcer: randomAddress(),
      AllowedCalldataEnforcer: randomAddress(),
      NativeTokenStreamingEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates a native token streaming CaveatBuilder with default empty calldata', () => {
    const config: NativeTokenStreamingScopeConfig = {
      type: ScopeType.NativeTokenStreaming,
      initialAmount: 1000n,
      maxAmount: 10000n,
      amountPerSecond: 1n,
      startTime: Math.floor(Date.now() / 1000),
    };

    const caveatBuilder = createNativeTokenStreamingCaveatBuilder(
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
        enforcer: environment.caveatEnforcers.NativeTokenStreamingEnforcer,
        args: '0x00',
        terms: concat([
          toHex(config.initialAmount, { size: 32 }),
          toHex(config.maxAmount, { size: 32 }),
          toHex(config.amountPerSecond, { size: 32 }),
          toHex(config.startTime, { size: 32 }),
        ]),
      },
    ]);
  });

  it('creates a native token streaming CaveatBuilder with empty allowedCalldata array (should fall back to default)', () => {
    const config: NativeTokenStreamingScopeConfig = {
      type: ScopeType.NativeTokenStreaming,
      initialAmount: 1000n,
      maxAmount: 10000n,
      amountPerSecond: 1n,
      startTime: Math.floor(Date.now() / 1000),
      allowedCalldata: [], // Empty array should trigger fallback to default exactCalldata
    };

    const caveatBuilder = createNativeTokenStreamingCaveatBuilder(
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
        enforcer: environment.caveatEnforcers.NativeTokenStreamingEnforcer,
        args: '0x00',
        terms: concat([
          toHex(config.initialAmount, { size: 32 }),
          toHex(config.maxAmount, { size: 32 }),
          toHex(config.amountPerSecond, { size: 32 }),
          toHex(config.startTime, { size: 32 }),
        ]),
      },
    ]);
  });

  it('creates a native token streaming CaveatBuilder with allowedCalldata', () => {
    const config: NativeTokenStreamingScopeConfig = {
      type: ScopeType.NativeTokenStreaming,
      initialAmount: 1000n,
      maxAmount: 10000n,
      amountPerSecond: 1n,
      startTime: Math.floor(Date.now() / 1000),
      allowedCalldata: [
        {
          startIndex: 4,
          value: '0x1234',
        },
      ],
    };

    const caveatBuilder = createNativeTokenStreamingCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.have.lengthOf(2);
    expect(caveats[0]?.enforcer).to.equal(
      environment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveats[1]?.enforcer).to.equal(
      environment.caveatEnforcers.NativeTokenStreamingEnforcer,
    );
  });
});
