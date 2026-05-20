import { describe, expect, it, vi } from 'vitest';

import type { x402PaymentRequirements } from '../src/x402Client';
import { x402Erc7710Client } from '../src/x402Client';

const baseRequirements: x402PaymentRequirements = {
  scheme: 'exact',
  network: 'eip155:8453',
  asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  amount: '1000',
  payTo: '0x1111111111111111111111111111111111111111',
  maxTimeoutSeconds: 300,
  extra: {
    assetTransferMethod: 'erc7710',
  },
};

describe('x402Erc7710Client', () => {
  it('exposes the exact scheme identifier', () => {
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn(),
    });

    expect(client.scheme).toBe('exact');
  });

  it('creates an ERC-7710 payload and normalizes addresses', async () => {
    const delegationProvider = vi.fn().mockResolvedValue({
      delegationManager: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      permissionContext: '0x1234',
      delegator: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    const client = new x402Erc7710Client({ delegationProvider });

    const payload = await client.createPaymentPayload(2, baseRequirements);

    expect(delegationProvider).toHaveBeenCalledWith(baseRequirements);
    expect(payload).toEqual({
      x402Version: 2,
      payload: {
        delegationManager: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
        permissionContext: '0x1234',
        delegator: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      },
    });
  });

  it('throws when permissionContext is empty hex', async () => {
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn().mockResolvedValue({
        delegationManager: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        permissionContext: '0x',
        delegator: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      }),
    });

    await expect(
      client.createPaymentPayload(2, baseRequirements),
    ).rejects.toThrow(
      'Invalid delegation payload: permissionContext must be non-empty hex data',
    );
  });

  it('throws when permissionContext is not hex', async () => {
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn().mockResolvedValue({
        delegationManager: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        permissionContext: 'not-hex',
        delegator: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      }),
    });

    await expect(
      client.createPaymentPayload(2, baseRequirements),
    ).rejects.toThrow(
      'Invalid delegation payload: permissionContext must be non-empty hex data',
    );
  });

  it('delegates to fallback client for non-erc7710 methods', async () => {
    const fallbackResult = {
      x402Version: 2,
      payload: { kind: 'fallback' },
    };
    const fallbackClient = {
      scheme: 'exact',
      createPaymentPayload: vi.fn().mockResolvedValue(fallbackResult),
    };
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn(),
      fallbackClient,
    });
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: { assetTransferMethod: 'eip3009' },
    };
    const context = { marker: 'ctx' };

    const result = await client.createPaymentPayload(2, requirements, context);

    expect(fallbackClient.createPaymentPayload).toHaveBeenCalledWith(
      2,
      requirements,
      context,
    );
    expect(result).toEqual(fallbackResult);
  });

  it('throws for non-erc7710 methods without fallback', async () => {
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn(),
    });
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: { assetTransferMethod: 'eip3009' },
    };

    await expect(client.createPaymentPayload(2, requirements)).rejects.toThrow(
      'x402Erc7710Client can only process assetTransferMethod "erc7710". Received: "eip3009"',
    );
  });

  it('throws with undefined method when extra is missing', async () => {
    const client = new x402Erc7710Client({
      delegationProvider: vi.fn(),
    });
    const requirements: x402PaymentRequirements = {
      ...baseRequirements,
      extra: undefined,
    };

    await expect(client.createPaymentPayload(2, requirements)).rejects.toThrow(
      'x402Erc7710Client can only process assetTransferMethod "erc7710". Received: undefined',
    );
  });
});
