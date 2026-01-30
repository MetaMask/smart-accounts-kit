import { encodeSingle } from '@metamask/abi-utils';
import { bytesToHex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { createExactCalldataBatchTerms } from '../../src/caveats/exactCalldataBatch';
import type { Hex } from '../../src/types';

describe('createExactCalldataBatchTerms', () => {
  const targetA: Hex = '0x0000000000000000000000000000000000000003';
  const targetB: Hex = '0x0000000000000000000000000000000000000004';

  const executions = [
    { target: targetA, value: 0n, callData: '0xdeadbeef' as Hex },
    { target: targetB, value: 5n, callData: '0x' as Hex },
  ];

  it('creates valid terms for calldata batch', () => {
    const result = createExactCalldataBatchTerms({ executions });
    const expected = bytesToHex(
      encodeSingle('(address,uint256,bytes)[]', [
        [targetA, 0n, '0xdeadbeef'],
        [targetB, 5n, '0x'],
      ]),
    );

    expect(result).toStrictEqual(expected);
  });

  it('throws for invalid calldata', () => {
    expect(() =>
      createExactCalldataBatchTerms({
        executions: [
          { target: targetA, value: 0n, callData: 'deadbeef' as any },
        ],
      }),
    ).toThrow('Invalid calldata: must be a hex string starting with 0x');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createExactCalldataBatchTerms(
      { executions },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
  });
});
