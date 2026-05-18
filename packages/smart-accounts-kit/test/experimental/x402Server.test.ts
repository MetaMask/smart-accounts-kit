import { describe, expect, it } from 'vitest';
import { zeroAddress } from 'viem';

import { X402Erc7710Server } from '../../src/experimental/x402Server';

describe('X402Erc7710Server', () => {
  const paymentRequirements = {
    scheme: 'exact',
    network: 'eip155:8453',
    asset: zeroAddress,
    amount: '10000',
    payTo: zeroAddress,
    maxTimeoutSeconds: 300,
    extra: {
      foo: 'bar',
    },
  };

  it('adds erc7710 assetTransferMethod to payment requirements', async () => {
    const server = new X402Erc7710Server();

    const result = await server.enhancePaymentRequirements(paymentRequirements);

    expect(result).toStrictEqual({
      ...paymentRequirements,
      extra: {
        foo: 'bar',
        assetTransferMethod: 'erc7710',
      },
    });
  });

  it('throws when an incompatible assetTransferMethod already exists', async () => {
    const server = new X402Erc7710Server();

    await expect(
      server.enhancePaymentRequirements({
        ...paymentRequirements,
        extra: {
          assetTransferMethod: 'permit2',
        },
      }),
    ).rejects.toThrow(
      'Cannot overwrite existing assetTransferMethod "permit2" with "erc7710"',
    );
  });

  it('allows overriding existing assetTransferMethod when configured', async () => {
    const server = new X402Erc7710Server({
      allowAssetTransferMethodOverride: true,
    });

    const result = await server.enhancePaymentRequirements({
      ...paymentRequirements,
      extra: {
        assetTransferMethod: 'permit2',
      },
    });

    expect(result.extra).toStrictEqual({
      assetTransferMethod: 'erc7710',
    });
  });
});
