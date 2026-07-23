import type { EnforcerAddressesByName } from '../src/permissions/types';

export const toWord = (value: bigint | number): string =>
  BigInt(value).toString(16).padStart(64, '0');

export const contracts: EnforcerAddressesByName = {
  erc20StreamingEnforcer: '0x1234567890abcdef1234567890abcdef12345678',
  erc20PeriodTransferEnforcer: '0x234567890abcdef1234567890abcdef123456781',
  erc20TransferAmountEnforcer: '0xcc34567890abcdef1234567890abcdef12345678',
  nativeTokenStreamingEnforcer: '0x34567890abcdef1234567890abcdef1234567812',
  nativeTokenPeriodTransferEnforcer:
    '0x4567890abcdef1234567890abcdef12345678123',
  nativeTokenTransferAmountEnforcer:
    '0xd4567890abcdef1234567890abcdef1234567812',
  approvalRevocationEnforcer: '0x567890abcdef1234567890abcdef123456781234',
  exactCalldataEnforcer: '0x67890abcdef1234567890abcdef1234567812345',
  valueLteEnforcer: '0x7890abcdef1234567890abcdef12345678123456',
  timestampEnforcer: '0x890abcdef1234567890abcdef123456781234567',
  nonceEnforcer: '0x90abcdef1234567890abcdef1234567812345678',
  allowedCalldataEnforcer: '0x0abcdef1234567890abcdef12345678123456789',
  allowedTargetsEnforcer: '0xabcdef1234567890abcdef123456781234567890',
  redeemerEnforcer: '0xbcdef1234567890abcdef123456781234567890a',
};
