import type { Hex } from 'viem';
import { concat, toHex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createFunctionCallCaveatBuilder } from '../../../src/caveatBuilder/scope/functionCallScope';
import type { FunctionCallScopeConfig } from '../../../src/caveatBuilder/scope/functionCallScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createFunctionCallCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      AllowedTargetsEnforcer: randomAddress(),
      AllowedMethodsEnforcer: randomAddress(),
      AllowedCalldataEnforcer: randomAddress(),
      ExactCalldataEnforcer: randomAddress(),
      ValueLteEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates a Function Call CaveatBuilder', () => {
    const config: FunctionCallScopeConfig = {
      type: ScopeType.FunctionCall,
      targets: [randomAddress()],
      selectors: ['0x12345678'],
    };

    const caveatBuilder = createFunctionCallCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        args: '0x00',
        terms: concat(config.targets),
      },
      {
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        args: '0x00',
        terms: concat(config.selectors as Hex[]),
      },
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms: toHex(0n, { size: 32 }),
      },
    ]);
  });

  it('creates a Function Call CaveatBuilder with allowed calldata', () => {
    const allowedCalldata = { value: '0x12345678', startIndex: 0 } as const;
    const config: FunctionCallScopeConfig = {
      type: ScopeType.FunctionCall,
      targets: [randomAddress()],
      selectors: ['0x12345678'],
      allowedCalldata: [allowedCalldata],
    };

    const caveatBuilder = createFunctionCallCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        args: '0x00',
        terms: concat(config.targets),
      },
      {
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        args: '0x00',
        terms: concat(config.selectors as Hex[]),
      },
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms: toHex(0n, { size: 32 }),
      },
      {
        enforcer: environment.caveatEnforcers.AllowedCalldataEnforcer,
        args: '0x00',
        terms: concat([
          toHex(allowedCalldata.startIndex, { size: 32 }),
          allowedCalldata.value,
        ]),
      },
    ]);
  });

  it('creates a Function Call CaveatBuilder with exact calldata', () => {
    const exactCalldata = { calldata: '0x12345678' } as const;
    const config: FunctionCallScopeConfig = {
      type: ScopeType.FunctionCall,
      targets: [randomAddress()],
      selectors: ['0x12345678'],
      exactCalldata,
    };

    const caveatBuilder = createFunctionCallCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        args: '0x00',
        terms: concat(config.targets),
      },
      {
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        args: '0x00',
        terms: concat(config.selectors as Hex[]),
      },
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms: toHex(0n, { size: 32 }),
      },
      {
        enforcer: environment.caveatEnforcers.ExactCalldataEnforcer,
        args: '0x00',
        terms: exactCalldata.calldata,
      },
    ]);
  });

  it('creates a Function Call CaveatBuilder with configured valueLte', () => {
    const config: FunctionCallScopeConfig = {
      type: ScopeType.FunctionCall,
      targets: [randomAddress()],
      selectors: ['0x12345678'],
      valueLte: { maxValue: 123n },
    };

    const caveatBuilder = createFunctionCallCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
        args: '0x00',
        terms: concat(config.targets),
      },
      {
        enforcer: environment.caveatEnforcers.AllowedMethodsEnforcer,
        args: '0x00',
        terms: concat(config.selectors as Hex[]),
      },
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms: toHex(123n, { size: 32 }),
      },
    ]);
  });

  it('throws an error for invalid configuration', () => {
    const config = {
      type: ScopeType.FunctionCall,
    } as unknown as FunctionCallScopeConfig;

    expect(() => createFunctionCallCaveatBuilder(environment, config)).to.throw(
      'Invalid Function Call configuration',
    );
  });
});
