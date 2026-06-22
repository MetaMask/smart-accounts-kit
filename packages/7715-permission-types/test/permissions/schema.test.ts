import {
  ALL_METAMASK_FACILITATOR_ADDRESSES,
  getPermissionSchemaEntry,
  isMetaMaskFacilitatorAddress,
} from '../../src';

describe('permission schemas', () => {
  it('returns the schema for a known permission type', () => {
    const schema = getPermissionSchemaEntry('native-token-stream');

    expect(schema.tokenVariant).toBe('native');
    expect(schema.tokenResolution).toStrictEqual({ kind: 'native' });
  });

  it('falls back to the unknown schema when no matching type exists', () => {
    const unknownSchema = getPermissionSchemaEntry('unregistered-type');
    const unknownTypeElement = unknownSchema.sections
      .flatMap((section) => section.elements)
      .find(
        (element) =>
          'testId' in element &&
          element.testId === 'review-gator-permission-unknown-type',
      );

    expect(unknownTypeElement?.type).toBe('raw-text');
  });

  it('throws for an unknown permission type when requested', () => {
    expect(() => getPermissionSchemaEntry('unregistered-type', true)).toThrow(
      'Unknown permission type: unregistered-type',
    );
  });

  it('does not treat inherited object properties as matching permission types', () => {
    const unknownSchema = getPermissionSchemaEntry('__proto__');
    const unknownTypeElement = unknownSchema.sections
      .flatMap((section) => section.elements)
      .find(
        (element) =>
          'testId' in element &&
          element.testId === 'review-gator-permission-unknown-type',
      );

    expect(unknownTypeElement?.type).toBe('raw-text');
    expect(() => getPermissionSchemaEntry('__proto__', true)).toThrow(
      'Unknown permission type: __proto__',
    );
  });
});

describe('MetaMask facilitator addresses', () => {
  it('matches facilitator addresses case-insensitively', () => {
    expect(
      isMetaMaskFacilitatorAddress(
        ALL_METAMASK_FACILITATOR_ADDRESSES[0].toLowerCase(),
      ),
    ).toBe(true);
  });

  it('returns false for unknown addresses', () => {
    expect(
      isMetaMaskFacilitatorAddress(
        '0x0000000000000000000000000000000000000001',
      ),
    ).toBe(false);
  });
});
