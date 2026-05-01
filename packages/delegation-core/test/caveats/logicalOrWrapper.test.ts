import { encodeSingle } from '@metamask/abi-utils';
import { bytesToHex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import {
  createLogicalOrWrapperTerms,
  decodeLogicalOrWrapperTerms,
  createLogicalOrWrapperArgs,
  decodeLogicalOrWrapperArgs,
} from '../../src/caveats/logicalOrWrapper';
import type { Hex } from '../../src/types';

describe('LogicalOrWrapper', () => {
  const enforcerA: Hex = '0x0000000000000000000000000000000000000001';
  const enforcerB: Hex = '0x0000000000000000000000000000000000000002';
  const enforcerC: Hex = '0x0000000000000000000000000000000000000003';

  const caveatGroups = [
    [
      { enforcer: enforcerA, terms: '0x1234' as Hex, args: '0x00' as Hex },
      { enforcer: enforcerB, terms: '0x5678' as Hex, args: '0x00' as Hex },
    ],
    [{ enforcer: enforcerC, terms: '0xabcd' as Hex, args: '0x00' as Hex }],
  ];

  describe('createLogicalOrWrapperTerms', () => {
    it('creates valid terms for caveat groups', () => {
      const result = createLogicalOrWrapperTerms({ caveatGroups });
      const expected = bytesToHex(
        encodeSingle('(address,bytes,bytes)[][]', [
          [
            [enforcerA, '0x1234', '0x00'],
            [enforcerB, '0x5678', '0x00'],
          ],
          [[enforcerC, '0xabcd', '0x00']],
        ]),
      );

      expect(result).toStrictEqual(expected);
    });

    it('throws for empty caveatGroups array', () => {
      expect(() => createLogicalOrWrapperTerms({ caveatGroups: [] })).toThrow(
        'Invalid caveatGroups: must provide at least one caveat group',
      );
    });

    it('throws for empty group within caveatGroups', () => {
      expect(() => createLogicalOrWrapperTerms({ caveatGroups: [[]] })).toThrow(
        'Invalid caveatGroups: group at index 0 must contain at least one caveat',
      );
    });

    it('throws for invalid enforcer address', () => {
      expect(() =>
        createLogicalOrWrapperTerms({
          caveatGroups: [[{ enforcer: '0x1234', terms: '0x00', args: '0x00' }]],
        }),
      ).toThrow('Invalid enforcer: must be a valid address');
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createLogicalOrWrapperTerms(
        { caveatGroups },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('decodeLogicalOrWrapperTerms', () => {
    it('round-trips through encode and decode', () => {
      const original = { caveatGroups };
      expect(
        decodeLogicalOrWrapperTerms(createLogicalOrWrapperTerms(original)),
      ).toStrictEqual(original);
    });

    it('accepts Uint8Array terms from the encoder', () => {
      const original = { caveatGroups };
      const bytes = createLogicalOrWrapperTerms(original, { out: 'bytes' });
      expect(decodeLogicalOrWrapperTerms(bytes)).toStrictEqual(original);
    });

    it('returns bytes when bytes encoding is specified', () => {
      const encoded = createLogicalOrWrapperTerms({ caveatGroups });
      const decoded = decodeLogicalOrWrapperTerms(encoded, { out: 'bytes' });

      const firstCaveat = decoded.caveatGroups[0]?.[0];
      expect(firstCaveat?.enforcer).toBeInstanceOf(Uint8Array);
      expect(firstCaveat?.terms).toBeInstanceOf(Uint8Array);
      expect(firstCaveat?.args).toBeInstanceOf(Uint8Array);
    });
  });

  describe('createLogicalOrWrapperArgs', () => {
    it('encodes group index', () => {
      const result = createLogicalOrWrapperArgs({ groupIndex: 0n });
      const expected = bytesToHex(encodeSingle('uint256', 0n));

      expect(result).toStrictEqual(expected);
    });

    it('encodes non-zero group index', () => {
      const result = createLogicalOrWrapperArgs({ groupIndex: 1n });
      const expected = bytesToHex(encodeSingle('uint256', 1n));

      expect(result).toStrictEqual(expected);
    });

    it('throws for negative group index', () => {
      expect(() => createLogicalOrWrapperArgs({ groupIndex: -1n })).toThrow(
        'Invalid groupIndex: must be a non-negative number',
      );
    });

    it('returns Uint8Array when bytes encoding is specified', () => {
      const result = createLogicalOrWrapperArgs(
        { groupIndex: 0n },
        { out: 'bytes' },
      );

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('decodeLogicalOrWrapperArgs', () => {
    it('round-trips through encode and decode', () => {
      const original = { groupIndex: 1n };
      expect(
        decodeLogicalOrWrapperArgs(createLogicalOrWrapperArgs(original)),
      ).toStrictEqual(original);
    });

    it('decodes zero index', () => {
      const encoded = createLogicalOrWrapperArgs({ groupIndex: 0n });
      expect(decodeLogicalOrWrapperArgs(encoded)).toStrictEqual({
        groupIndex: 0n,
      });
    });
  });
});
