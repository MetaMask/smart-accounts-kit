import { describe, it, expect } from 'vitest';

import { createExactExecutionTerms } from '../../src/caveats/exactExecution';

describe('createExactExecutionTerms', () => {
  const target = '0x00000000000000000000000000000000000000ab';

  it('creates valid terms for execution', () => {
    const result = createExactExecutionTerms({
      execution: {
        target,
        value: 1n,
        callData: '0x1234',
      },
    });

    expect(result).toStrictEqual(
      '0x00000000000000000000000000000000000000ab' +
        '0000000000000000000000000000000000000000000000000000000000000001' +
        '1234',
    );
  });

  it('throws for invalid target', () => {
    expect(() =>
      createExactExecutionTerms({
        execution: {
          target: '0x1234',
          value: 1n,
          callData: '0x',
        },
      }),
    ).toThrow('Invalid target: must be a valid address');
  });

  it('throws for negative value', () => {
    expect(() =>
      createExactExecutionTerms({
        execution: {
          target,
          value: -1n,
          callData: '0x',
        },
      }),
    ).toThrow('Invalid value: must be a non-negative number');
  });

  it('throws for invalid calldata', () => {
    expect(() =>
      createExactExecutionTerms({
        execution: {
          target,
          value: 0n,
          callData: '1234' as any,
        },
      }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createExactExecutionTerms(
      {
        execution: {
          target,
          value: 1n,
          callData: '0x1234',
        },
      },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(20 + 32 + 2);
  });
});
