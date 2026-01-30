import { createAllowedMethodsTerms } from '@metamask/delegation-core';
import { isHex, toFunctionSelector } from 'viem';
import type { AbiFunction, Hex } from 'viem';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const allowedMethods = 'allowedMethods';

export type MethodSelector = Hex | string | AbiFunction;

// length of function selector in chars, _including_ 0x prefix
const FUNCTION_SELECTOR_STRING_LENGTH = 10;

export type AllowedMethodsBuilderConfig = {
  /**
   * An array of method selectors that the delegate is allowed to call.
   * Can be 4-byte hex strings, ABI function signatures, or ABIFunction objects.
   */
  selectors: MethodSelector[];
};

/**
 * Builds a caveat struct for the AllowedMethodsEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the allowed function selectors.
 * @returns The Caveat.
 * @throws Error if no selectors are provided or if any selector is invalid.
 */
export const allowedMethodsBuilder = (
  environment: SmartAccountsEnvironment,
  config: AllowedMethodsBuilderConfig,
): Caveat => {
  const { selectors } = config;

  if (selectors.length === 0) {
    throw new Error('Invalid selectors: must provide at least one selector');
  }

  const parsedSelectors = selectors.map(parseSelector);

  const terms = createAllowedMethodsTerms({ selectors: parsedSelectors });

  const {
    caveatEnforcers: { AllowedMethodsEnforcer },
  } = environment;

  if (!AllowedMethodsEnforcer) {
    throw new Error('AllowedMethodsEnforcer not found in environment');
  }

  return {
    enforcer: AllowedMethodsEnforcer,
    terms,
    args: '0x00',
  };
};

/**
 * Parses a method selector into a hex string.
 *
 * @param selector - The method selector to parse.
 * @returns The parsed selector as a hex string.
 */
function parseSelector(selector: MethodSelector) {
  if (isHex(selector)) {
    if (selector.length === FUNCTION_SELECTOR_STRING_LENGTH) {
      return selector;
    }
    throw new Error(
      'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
    );
  }

  try {
    return toFunctionSelector(selector);
  } catch (rootError: any) {
    throw new Error(
      'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction',
      { cause: rootError },
    );
  }
}
