import { encodeSingle } from '@metamask/abi-utils';
import { bytesToHex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { createExactExecutionBatchTerms } from '../../src/caveats/exactExecutionBatch';
import type { Hex } from '../../src/types';

describe('createExactExecutionBatchTerms', () => {
  const targetA: Hex = '0x0000000000000000000000000000000000000001';
  const targetB: Hex = '0x0000000000000000000000000000000000000002';

  const executions = [
    { target: targetA, value: 1n, callData: '0x1234' as Hex },
    { target: targetB, value: 2n, callData: '0x' as Hex },
  ];

  it('creates valid terms for execution batch', () => {
    const result = createExactExecutionBatchTerms({ executions });
    const expected = bytesToHex(
      encodeSingle('(address,uint256,bytes)[]', [
        [targetA, 1n, '0x1234'],
        [targetB, 2n, '0x'],
      ]),
    );

    expect(result).toStrictEqual(expected);
  });

  it('throws for empty executions array', () => {
    expect(() => createExactExecutionBatchTerms({ executions: [] })).toThrow(
      'Invalid executions: array cannot be empty',
    );
  });

  it('throws for invalid target', () => {
    expect(() =>
      createExactExecutionBatchTerms({
        executions: [{ target: '0x1234', value: 1n, callData: '0x' }],
      }),
    ).toThrow('Invalid target: must be a valid address');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createExactExecutionBatchTerms(
      { executions },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
  });
});
