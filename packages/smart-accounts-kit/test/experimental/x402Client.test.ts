import { stub } from 'sinon';
import { beforeEach, describe, expect, it } from 'vitest';
import { zeroAddress } from 'viem';

import { X402Erc7710Client } from '../../src/experimental/x402Client';

describe('X402Erc7710Client', () => {
  const paymentRequirements = {
    scheme: 'exact',
    network: 'eip155:1',
    asset: zeroAddress,
    amount: '1000',
    payTo: zeroAddress,
    maxTimeoutSeconds: 60,
    extra: {
      assetTransferMethod: 'erc7710',
    },
  };

  const delegationProvider = stub();

  beforeEach(() => {
    delegationProvider.reset();
  });

  it('creates an ERC-7710 payload when assetTransferMethod is erc7710', async () => {
    delegationProvider.resolves({
      delegationManager: zeroAddress,
      permissionContext: '0x1234',
      delegator: zeroAddress,
    });

    const client = new X402Erc7710Client({ delegationProvider });

    const result = await client.createPaymentPayload(2, paymentRequirements);

    expect(result).toStrictEqual({
      x402Version: 2,
      payload: {
        delegationManager: zeroAddress,
        permissionContext: '0x1234',
        delegator: zeroAddress,
      },
    });
    expect(delegationProvider.calledOnceWithExactly(paymentRequirements)).toBe(
      true,
    );
  });

  it('throws when transfer method is not erc7710 and no fallback is configured', async () => {
    const client = new X402Erc7710Client({ delegationProvider });

    await expect(
      client.createPaymentPayload(2, {
        ...paymentRequirements,
        extra: { assetTransferMethod: 'permit2' },
      }),
    ).rejects.toThrow(
      'X402Erc7710Client can only process assetTransferMethod "erc7710"',
    );
    expect(delegationProvider.notCalled).toBe(true);
  });

  it('delegates to fallback client for non-erc7710 payment requirements', async () => {
    const fallbackClient = {
      scheme: 'exact',
      createPaymentPayload: stub().resolves({
        x402Version: 2,
        payload: { signature: '0xabc' },
      }),
    };

    const client = new X402Erc7710Client({
      delegationProvider,
      fallbackClient,
    });

    const non7710Requirements = {
      ...paymentRequirements,
      extra: { assetTransferMethod: 'permit2' },
    };

    const result = await client.createPaymentPayload(
      2,
      non7710Requirements,
      { extensions: {} },
    );

    expect(result).toStrictEqual({
      x402Version: 2,
      payload: { signature: '0xabc' },
    });
    expect(
      fallbackClient.createPaymentPayload.calledOnceWithExactly(
        2,
        non7710Requirements,
        { extensions: {} },
      ),
    ).toBe(true);
    expect(delegationProvider.notCalled).toBe(true);
  });

  it('throws when delegation provider returns empty permissionContext', async () => {
    delegationProvider.resolves({
      delegationManager: zeroAddress,
      permissionContext: '0x',
      delegator: zeroAddress,
    });

    const client = new X402Erc7710Client({ delegationProvider });

    await expect(
      client.createPaymentPayload(2, paymentRequirements),
    ).rejects.toThrow(
      'Invalid delegation payload: permissionContext must be non-empty hex data',
    );
  });
});
