import { describe, expect, it } from 'vitest';

import type { x402PaymentRequirements } from '../src/x402Client';
import { x402Erc7710Server } from '../src/x402Server';

const baseRequirements: x402PaymentRequirements = {
  scheme: 'exact',
  network: 'eip155:8453',
  asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  amount: '1000',
  payTo: '0x1111111111111111111111111111111111111111',
  maxTimeoutSeconds: 300,
  extra: {},
};

describe('x402Erc7710Server', () => {
  it('exposes the exact scheme identifier', () => {
    const server = new x402Erc7710Server();

    expect(server.scheme).toBe('exact');
  });

  it('sets assetTransferMethod to erc7710', async () => {
    const server = new x402Erc7710Server();

    const result = await server.enhancePaymentRequirements(
      baseRequirements,
      {},
    );

    expect(result.extra?.assetTransferMethod).toBe('erc7710');
  });

  it('handles payment requirements with no extra', async () => {
    const server = new x402Erc7710Server();
    const requirementsWithoutExtra: x402PaymentRequirements = {
      ...baseRequirements,
      extra: undefined,
    };

    const result = await server.enhancePaymentRequirements(
      requirementsWithoutExtra,
      {},
    );

    expect(result.extra).toEqual({
      assetTransferMethod: 'erc7710',
    });
  });

  it('preserves existing extra fields', async () => {
    const server = new x402Erc7710Server();
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: { existing: 'value' },
    };

    const result = await server.enhancePaymentRequirements(requirements, {});

    expect(result.extra).toMatchObject({
      existing: 'value',
      assetTransferMethod: 'erc7710',
    });
  });

  it('throws when overwriting a different method is not allowed', async () => {
    const server = new x402Erc7710Server();
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: { assetTransferMethod: 'eip3009' },
    };

    await expect(
      server.enhancePaymentRequirements(requirements, {}),
    ).rejects.toThrow(
      'Cannot overwrite existing assetTransferMethod "eip3009" with "erc7710"',
    );
  });

  it('allows overwriting when configured', async () => {
    const server = new x402Erc7710Server({
      allowAssetTransferMethodOverride: true,
    });
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: { assetTransferMethod: 'eip3009' },
    };

    const result = await server.enhancePaymentRequirements(requirements, {});

    expect(result.extra?.assetTransferMethod).toBe('erc7710');
  });

  it('does not set facilitatorAddresses when field is missing', async () => {
    const server = new x402Erc7710Server();

    const result = await server.enhancePaymentRequirements(baseRequirements, {
      extra: {},
    });

    expect(result.extra?.facilitatorAddresses).toBeUndefined();
  });

  it('normalizes and sets facilitatorAddresses when valid', async () => {
    const server = new x402Erc7710Server();

    const result = await server.enhancePaymentRequirements(baseRequirements, {
      extra: {
        facilitatorAddresses: [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        ],
      },
    });

    expect(result.extra?.facilitatorAddresses).toEqual([
      '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
      '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    ]);
  });

  it('normalizes all-uppercase facilitatorAddresses', async () => {
    const server = new x402Erc7710Server();

    const result = await server.enhancePaymentRequirements(baseRequirements, {
      extra: {
        facilitatorAddresses: ['0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
      },
    });

    expect(result.extra?.facilitatorAddresses).toEqual([
      '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
    ]);
  });

  it('throws when facilitatorAddresses is not an array', async () => {
    const server = new x402Erc7710Server();

    await expect(
      server.enhancePaymentRequirements(baseRequirements, {
        extra: { facilitatorAddresses: 'not-array' },
      }),
    ).rejects.toThrow(
      'Invalid facilitatorAddresses specified: expected an array of addresses',
    );
  });

  it('throws when facilitatorAddresses is empty', async () => {
    const server = new x402Erc7710Server();

    await expect(
      server.enhancePaymentRequirements(baseRequirements, {
        extra: { facilitatorAddresses: [] },
      }),
    ).rejects.toThrow(
      'Invalid facilitatorAddresses specified: expected at least one address',
    );
  });

  it('throws detailed errors for invalid facilitatorAddresses values', async () => {
    const server = new x402Erc7710Server();

    await expect(
      server.enhancePaymentRequirements(baseRequirements, {
        extra: {
          facilitatorAddresses: [123, 'not-an-address'],
        },
      }),
    ).rejects.toThrow(
      'Invalid facilitatorAddresses specified: facilitatorAddresses[0] must be a string; facilitatorAddresses[1] is not a valid address: "not-an-address"',
    );
  });

  it('throws for invalid mixed-case facilitatorAddress checksums', async () => {
    const server = new x402Erc7710Server();

    await expect(
      server.enhancePaymentRequirements(baseRequirements, {
        extra: {
          facilitatorAddresses: ['0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAB'],
        },
      }),
    ).rejects.toThrow(
      'Invalid facilitatorAddresses specified: facilitatorAddresses[0] is not a valid address: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAB"',
    );
  });
});
