import type { Caveat } from '@metamask/delegation-core';
import {
  createExactCalldataTerms,
  createNativeTokenStreamingTerms,
  decodeNativeTokenStreamingTerms,
} from '@metamask/delegation-core';
import { bigIntToHex } from '@metamask/utils';

import type { NativeTokenStreamPermission } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { nativePayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  DeepRequired,
  MakePermissionDecoderConfig,
} from '../types';
import { getTermsByEnforcer } from '../utils';

/**
 * Builds the configuration for the native-token-stream permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The native-token-stream permission decoder configuration.
 */
export function makeNativeTokenStreamDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): MakePermissionDecoderConfig {
  const {
    timestampEnforcer,
    nativeTokenStreamingEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'native-token-stream',
    contractAddresses,
    optionalEnforcers: [
      timestampEnforcer, // expiry rule
      redeemerEnforcer, // redeemer rule
      allowedTargetsEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [nativeTokenStreamingEnforcer]: 1,
      [exactCalldataEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [expiryRuleDecoder, redeemerRuleDecoder, nativePayeeRuleDecoder],
    validateAndDecodeData,
  };
}

/**
 * Decodes native-token-stream permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded stream terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<NativeTokenStreamPermission> {
  const { nativeTokenStreamingEnforcer, exactCalldataEnforcer } =
    contractAddresses;

  const exactCalldataTerms = getTermsByEnforcer({
    caveats,
    enforcer: exactCalldataEnforcer,
  });

  if (exactCalldataTerms !== '0x') {
    throw new Error('Invalid exact-calldata terms: must be 0x');
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: nativeTokenStreamingEnforcer,
  });
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    decodeNativeTokenStreamingTerms(terms);

  if (maxAmount <= initialAmount) {
    throw new Error(
      'Invalid native-token-stream terms: maxAmount must be greater than initialAmount',
    );
  }

  if (amountPerSecond === 0n) {
    throw new Error(
      'Invalid native-token-stream terms: amountPerSecond must be a positive number',
    );
  }

  if (startTime === 0) {
    throw new Error(
      'Invalid native-token-stream terms: startTime must be a positive number',
    );
  }

  return {
    initialAmount: bigIntToHex(initialAmount),
    maxAmount: bigIntToHex(maxAmount),
    amountPerSecond: bigIntToHex(amountPerSecond),
    startTime,
  };
}

/**
 * Enforcers required to build native token stream caveats.
 */
export type NativeTokenStreamEnforcers = Pick<
  ChecksumEnforcersByChainId,
  'nativeTokenStreamingEnforcer' | 'exactCalldataEnforcer'
>;

/**
 * Builds the native-token-stream caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated native-token-stream permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The native token streaming and exact-calldata caveats.
 */
export async function createNativeTokenStreamCaveats({
  permission,
  contracts,
}: {
  permission: DeepRequired<NativeTokenStreamPermission>;
  contracts: NativeTokenStreamEnforcers;
}): Promise<Caveat[]> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  const nativeTokenStreamingCaveat: Caveat = {
    enforcer: contracts.nativeTokenStreamingEnforcer,
    terms: createNativeTokenStreamingTerms({
      initialAmount: BigInt(initialAmount),
      maxAmount: BigInt(maxAmount),
      amountPerSecond: BigInt(amountPerSecond),
      startTime,
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({ calldata: '0x' }),
    args: '0x',
  };

  return [nativeTokenStreamingCaveat, exactCalldataCaveat];
}
