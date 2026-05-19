import type { PaymentRequirements } from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { x402ExactEvmErc7710ServerScheme } from '../src/x402ExactEvmErc7710ServerScheme';
import { x402Erc7710Server } from '../src/x402Server';

describe('x402ExactEvmErc7710ServerScheme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns base requirements unchanged for non-erc7710 methods', async () => {
    const baseRequirements = {
      scheme: 'exact',
      network: 'eip155:8453',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '1000',
      payTo: '0x1111111111111111111111111111111111111111',
      maxTimeoutSeconds: 300,
      extra: { assetTransferMethod: 'eip3009' },
    } as unknown as PaymentRequirements;
    const superSpy = vi
      .spyOn(ExactEvmScheme.prototype, 'enhancePaymentRequirements')
      .mockResolvedValue(baseRequirements);
    const erc7710Spy = vi.spyOn(
      x402Erc7710Server.prototype,
      'enhancePaymentRequirements',
    );
    const scheme = new x402ExactEvmErc7710ServerScheme();
    const supportedKind = {
      x402Version: 2,
      scheme: 'exact',
      network: 'eip155:8453' as const,
    };
    const facilitatorExtensions = ['extension'];

    const result = await scheme.enhancePaymentRequirements(
      baseRequirements,
      supportedKind,
      facilitatorExtensions,
    );

    expect(superSpy).toHaveBeenCalledWith(
      baseRequirements,
      supportedKind,
      facilitatorExtensions,
    );
    expect(erc7710Spy).not.toHaveBeenCalled();
    expect(result).toBe(baseRequirements);
  });

  it('enhances requirements for erc7710 methods', async () => {
    const baseRequirements = {
      scheme: 'exact',
      network: 'eip155:8453',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '1000',
      payTo: '0x1111111111111111111111111111111111111111',
      maxTimeoutSeconds: 300,
      extra: { assetTransferMethod: 'erc7710' },
    } as unknown as PaymentRequirements;
    const enhancedRequirements = {
      ...baseRequirements,
      extra: {
        ...baseRequirements.extra,
        facilitatorAddresses: ['0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'],
      },
    } as unknown as PaymentRequirements;
    vi.spyOn(ExactEvmScheme.prototype, 'enhancePaymentRequirements').mockResolvedValue(
      baseRequirements,
    );
    const erc7710Spy = vi
      .spyOn(x402Erc7710Server.prototype, 'enhancePaymentRequirements')
      .mockResolvedValue(enhancedRequirements);
    const scheme = new x402ExactEvmErc7710ServerScheme();
    const supportedKind = {
      x402Version: 2,
      scheme: 'exact',
      network: 'eip155:8453' as const,
      extra: {
        facilitatorAddresses: ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      },
    };

    const result = await scheme.enhancePaymentRequirements(
      baseRequirements,
      supportedKind,
      [],
    );

    expect(erc7710Spy).toHaveBeenCalledWith(baseRequirements, supportedKind);
    expect(result).toEqual(enhancedRequirements);
  });
});
