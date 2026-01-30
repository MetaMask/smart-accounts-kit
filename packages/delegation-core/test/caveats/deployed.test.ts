import { describe, it, expect } from 'vitest';

import { createDeployedTerms } from '../../src/caveats/deployed';

describe('createDeployedTerms', () => {
  const contractAddress = '0x00000000000000000000000000000000000000aa';
  const salt = '0x01';
  const bytecode = '0x1234';

  it('creates valid terms for deployment parameters', () => {
    const result = createDeployedTerms({ contractAddress, salt, bytecode });

    expect(result).toStrictEqual(
      '0x00000000000000000000000000000000000000aa' +
        '0000000000000000000000000000000000000000000000000000000000000001' +
        '1234',
    );
  });

  it('throws for invalid contract address', () => {
    expect(() =>
      createDeployedTerms({
        contractAddress: '0x1234',
        salt,
        bytecode,
      }),
    ).toThrow('Invalid contractAddress: must be a valid Ethereum address');
  });

  it('throws for invalid salt', () => {
    expect(() =>
      createDeployedTerms({
        contractAddress,
        salt: 'invalid' as any,
        bytecode,
      }),
    ).toThrow('Invalid salt: must be a valid hexadecimal string');
  });

  it('throws for invalid bytecode', () => {
    expect(() =>
      createDeployedTerms({
        contractAddress,
        salt,
        bytecode: 'invalid' as any,
      }),
    ).toThrow('Invalid bytecode: must be a valid hexadecimal string');
  });

  it('returns Uint8Array when bytes encoding is specified', () => {
    const result = createDeployedTerms(
      { contractAddress, salt, bytecode },
      { out: 'bytes' },
    );

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(20 + 32 + 2);
  });
});
