import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import type { Hex } from '@metamask/utils';
import { describe, it, expect } from 'vitest';

import { makePermissionDecoderConfigs } from '../../../src/permissions';
import {
  createTokenApprovalRevocationCaveats,
  makeTokenApprovalRevocationDecoderConfig,
  type TokenApprovalRevocationEnforcers,
} from '../../../src/permissions/caveats/tokenApprovalRevocation';
import { expiryRuleDecoder } from '../../../src/permissions/rules/expiry';
import type { ChecksumCaveat } from '../../../src/permissions/types';
import { getChecksumEnforcersByChainId } from '../../../src/permissions/utils';
import type {
  TokenApprovalRevocationPermission,
  Populated,
} from '../../../src/types';

describe('token-approval-revocation decoder config', () => {
  const chainId = CHAIN_ID.sepolia;
  const contracts = DELEGATOR_CONTRACTS['1.3.0'][chainId];
  const { timestampEnforcer, approvalRevocationEnforcer, nonceEnforcer } =
    getChecksumEnforcersByChainId(contracts);
  const decoder = makeTokenApprovalRevocationDecoderConfig(
    getChecksumEnforcersByChainId(contracts),
  );

  const makeCaveats = (approvalRevocationTerms: Hex): ChecksumCaveat[] => [
    {
      enforcer: approvalRevocationEnforcer,
      terms: approvalRevocationTerms,
      args: '0x',
    },
    {
      enforcer: nonceEnforcer,
      terms: '0x',
      args: '0x',
    },
  ];

  describe('static configuration', () => {
    it('exposes expected required enforcers', () => {
      expect(decoder.requiredEnforcers).toStrictEqual({
        [approvalRevocationEnforcer]: 1,
        [nonceEnforcer]: 1,
      });
    });

    it('exposes expected optional enforcers', () => {
      expect(decoder.optionalEnforcers).toStrictEqual([timestampEnforcer]);
    });

    it('includes expected rule decoders in order', () => {
      expect(decoder.rules).toStrictEqual([expiryRuleDecoder]);
    });
  });

  describe('validateAndDecodeData', () => {
    it('provides a validateAndDecodeData function', () => {
      expect(typeof decoder.validateAndDecodeData).toBe('function');
    });

    it('is included in makePermissionDecoderConfigs', () => {
      expect(makePermissionDecoderConfigs(contracts)).toContainEqual(decoder);
    });

    it('validateAndDecodeData rejects empty terms', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats('0x'),
          decoder.contractAddresses,
        ),
      ).toThrow('Invalid ApprovalRevocation terms: must be exactly 1 byte');
    });

    it('validateAndDecodeData rejects 0x00 terms', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats('0x00'),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid ApprovalRevocation terms: at least one revocation primitive must be enabled',
      );
    });

    it('validateAndDecodeData rejects terms whose mask exceeds the supported max', () => {
      expect(() =>
        decoder.validateAndDecodeData(
          makeCaveats('0x40'),
          decoder.contractAddresses,
        ),
      ).toThrow(
        'Invalid ApprovalRevocation terms: reserved bits must be zero (only bits 0-5 are defined)',
      );
    });

    it('validateAndDecodeData decodes a single enabled flag', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats('0x01'),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: false,
        permit2Approve: false,
        permit2Lockdown: false,
        permit2InvalidateNonces: false,
      });
    });

    it('validateAndDecodeData decodes all supported flags', () => {
      expect(
        decoder.validateAndDecodeData(
          makeCaveats('0x3f'),
          decoder.contractAddresses,
        ),
      ).toStrictEqual({
        erc20Approve: true,
        erc721Approve: true,
        erc721SetApprovalForAll: true,
        permit2Approve: true,
        permit2Lockdown: true,
        permit2InvalidateNonces: true,
      });
    });
  });
});

describe('createTokenApprovalRevocationCaveats()', () => {
  const contracts: TokenApprovalRevocationEnforcers = {
    approvalRevocationEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
  };

  const permission: Populated<TokenApprovalRevocationPermission> = {
    type: 'token-approval-revocation',
    data: {
      erc20Approve: true,
      erc721Approve: true,
      erc721SetApprovalForAll: true,
      permit2Approve: true,
      permit2Lockdown: true,
      permit2InvalidateNonces: true,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  };

  it('creates approvalRevocation caveat', () => {
    const caveats = createTokenApprovalRevocationCaveats({
      permission,
      contracts,
    });

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.approvalRevocationEnforcer,
        terms: '0x3f',
        args: '0x',
      },
    ]);
  });

  it('creates single-flag approvalRevocation caveat', () => {
    const singleFlagPermission: Populated<TokenApprovalRevocationPermission> = {
      ...permission,
      data: {
        ...permission.data,
        erc20Approve: true,
        erc721Approve: false,
        erc721SetApprovalForAll: false,
        permit2Approve: false,
        permit2Lockdown: false,
        permit2InvalidateNonces: false,
      },
    };

    const caveats = createTokenApprovalRevocationCaveats({
      permission: singleFlagPermission,
      contracts,
    });

    expect(caveats).toStrictEqual([
      {
        enforcer: contracts.approvalRevocationEnforcer,
        terms: '0x01',
        args: '0x',
      },
    ]);
  });

  it('rejects empty-mask approvalRevocation when all flags are false', () => {
    const noFlagPermission: Populated<TokenApprovalRevocationPermission> = {
      ...permission,
      data: {
        ...permission.data,
        erc20Approve: false,
        erc721Approve: false,
        erc721SetApprovalForAll: false,
        permit2Approve: false,
        permit2Lockdown: false,
        permit2InvalidateNonces: false,
      },
    };

    expect(() =>
      createTokenApprovalRevocationCaveats({
        permission: noFlagPermission,
        contracts,
      }),
    ).toThrow(
      'Invalid ApprovalRevocation terms: at least one revocation primitive must be enabled',
    );
  });
});
