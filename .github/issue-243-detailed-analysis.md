# Issue #243: Remove viem dependency from @metamask/x402 - Detailed Analysis

## Overview

Viem is currently listed as a peer dependency in `@metamask/x402` but is only used for basic address and hex validation utilities. Implementing custom validation functions would eliminate this dependency, reducing bundle size and simplifying the package's peer dependency requirements.

## Current Usage Analysis

### Files Affected

#### 1. `packages/x402/src/x402Server.ts`
**Lines:** 1, 44, 96

**Imports:**
```typescript
import { type Address, getAddress } from 'viem';
```

**Usage:**
- `getAddress(address)` - Used in `validateFacilitatorAddresses()` function to validate and normalize facilitator addresses to EIP-55 checksum format (line 44)
- The function iterates over an array of addresses and normalizes each one

**Code Context:**
```typescript
publishedAddresses.forEach((address, index) => {
  if (typeof address !== 'string') {
    validationErrors.push(`facilitatorAddresses[${index}] must be a string`);
    return;
  }

  try {
    normalizedAddresses.push(getAddress(address));
  } catch {
    validationErrors.push(
      `facilitatorAddresses[${index}] is not a valid address: "${address}"`,
    );
  }
});
```

#### 2. `packages/x402/src/x402Client.ts`
**Lines:** 1, 52, 59, 61

**Imports:**
```typescript
import { type Hex, getAddress, isHex } from 'viem';
```

**Usage:**
- `isHex(value)` - Validates that permissionContext is hex data (line 52)
- `getAddress(address)` - Normalizes delegationManager address (line 59)
- `getAddress(address)` - Normalizes delegator address (line 61)

**Code Context:**
```typescript
function normalizeDelegationPayload(
  payload: x402DelegationPaymentPayload,
): x402DelegationPaymentPayload {
  if (!isHex(payload.permissionContext) || payload.permissionContext === '0x') {
    throw new Error(
      'Invalid delegation payload: permissionContext must be non-empty hex data',
    );
  }

  return {
    delegationManager: getAddress(payload.delegationManager),
    permissionContext: payload.permissionContext,
    delegator: getAddress(payload.delegator),
  };
}
```

### Viem Functions Used

1. **`getAddress(address: string): Address`**
   - Validates Ethereum address format
   - Returns EIP-55 mixed-case checksum address
   - Throws error for invalid addresses

2. **`isHex(value: unknown): boolean`**
   - Validates that a value is a hex string
   - Checks for `0x` prefix and valid hex characters

3. **Type Definitions**
   - `Address` - Type alias for Ethereum addresses
   - `Hex` - Type alias for hex strings

### Dependency Declaration

In `packages/x402/package.json`:
```json
"peerDependencies": {
  "@x402/core": "^2.12.0",
  "@x402/evm": "^2.12.0",
  "viem": "^2.31.4"
},
"devDependencies": {
  "viem": "2.31.4",
}
```

## Proposed Implementation

### 1. Address Validation & Normalization Function

Replace `getAddress()` with a custom implementation:

```typescript
/**
 * Validates and normalizes an Ethereum address to EIP-55 checksum format.
 * 
 * @param address - Address string to validate
 * @returns Checksummed address
 * @throws Error if address is invalid
 */
function getChecksumAddress(address: string): Address {
  // Validate format: 0x followed by 40 hex characters
  if (typeof address !== 'string') {
    throw new Error('Invalid address: must be a string');
  }
  
  const addressRegex = /^0x[0-9a-fA-F]{40}$/;
  if (!addressRegex.test(address)) {
    throw new Error('Invalid address format');
  }
  
  // Convert to checksum format using keccak256 hash
  // Implementation would need a lightweight keccak256 function
  // or use a simpler normalization strategy
  
  return checksummedAddress as Address;
}
```

**Note:** Full EIP-55 checksum implementation requires keccak256 hashing. Options:
1. Implement lightweight keccak256 or import minimal hash library
2. Use simpler validation without checksum (just format validation)
3. Return lowercase normalized addresses instead of checksummed

### 2. Hex Validation Function

Replace `isHex()` with:

```typescript
/**
 * Validates that a value is a hex string.
 * 
 * @param value - Value to check
 * @returns True if value is hex string with 0x prefix
 */
function isHexString(value: unknown): value is Hex {
  if (typeof value !== 'string') {
    return false;
  }
  
  if (value.length < 2 || !value.startsWith('0x')) {
    return false;
  }
  
  // Check all characters after 0x are valid hex
  const hexChars = value.slice(2);
  return /^[0-9a-fA-F]*$/.test(hexChars);
}
```

### 3. Type Definitions

Replace type imports with:

```typescript
/**
 * Ethereum address type (0x-prefixed 40-character hex string)
 */
type Address = `0x${string}`;

/**
 * Hex string type (0x-prefixed hex data)
 */
type Hex = `0x${string}`;
```

### 4. File Changes Summary

**Create new file:** `packages/x402/src/utils/ethereum.ts`
```typescript
// All validation functions and types
export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export function getChecksumAddress(address: string): Address;
export function isHexString(value: unknown): value is Hex;
```

**Update:** `packages/x402/src/x402Server.ts`
```typescript
- import { type Address, getAddress } from 'viem';
+ import { type Address, getChecksumAddress } from './utils/ethereum';

// Replace getAddress() calls with getChecksumAddress()
```

**Update:** `packages/x402/src/x402Client.ts`
```typescript
- import { type Hex, getAddress, isHex } from 'viem';
+ import { type Hex, type Address, getChecksumAddress, isHexString } from './utils/ethereum';

// Replace getAddress() calls with getChecksumAddress()
// Replace isHex() calls with isHexString()
```

**Update:** `packages/x402/package.json`
```json
// Remove viem from peerDependencies and devDependencies
```

## Benefits

### 1. Reduced Bundle Size
- Viem is a comprehensive library (~100KB+ minified)
- Custom implementation would be <1KB
- Significant reduction for consumers of `@metamask/x402`

### 2. Simplified Dependencies
- One fewer peer dependency for consumers to manage
- Reduces potential version conflicts
- Easier installation and setup

### 3. Better Alignment with Package Philosophy
- Package README notes: "intentionally does not depend on `@metamask/smart-accounts-kit`"
- Removing viem continues this minimal dependency approach
- Makes the package more standalone and reusable

### 4. Full Control
- Custom error messages tailored to the package
- No breaking changes from upstream viem updates
- Easier to maintain and test

## Testing Requirements

### Existing Test Coverage

All existing tests must pass without modification:

**`test/x402Server.test.ts`** (9 test cases):
- ✓ Checksum address conversion validation (lines 104-120)
- ✓ Invalid address rejection (lines 146-158)
- ✓ Array validation (lines 122-144)

**`test/x402Client.test.ts`** (8 test cases):
- ✓ Address normalization (lines 27-46)
- ✓ Hex validation - empty `0x` rejection (lines 48-62)
- ✓ Hex validation - non-hex rejection (lines 64-78)

### Critical Behaviors to Preserve

1. **Address Checksum Conversion**
   - Input: `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
   - Output: `0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa`
   - Case-insensitive input acceptance

2. **Invalid Address Handling**
   - Reject non-string values with clear error
   - Reject malformed addresses (wrong length, invalid chars)
   - Provide descriptive error messages with context

3. **Hex Validation**
   - Accept valid hex: `0x1234`, `0xabcdef`
   - Reject empty: `0x`
   - Reject non-hex: `not-hex`, `123` (no prefix)
   - Type guard behavior for TypeScript

## Implementation Considerations

### EIP-55 Checksum

The main complexity is implementing EIP-55 checksum, which requires:
- Keccak256 hash function
- Converting hash to address case pattern

**Options:**
1. **Import minimal keccak256 library** (e.g., `@noble/hashes` ~20KB)
2. **Accept non-checksummed addresses** (just validate format)
3. **Use simple normalization** (lowercase all addresses)

**Recommendation:** Import minimal hash library to maintain exact viem behavior and ensure test compatibility.

### Backwards Compatibility

- Since this is a peer dependency removal, it's a **breaking change**
- Requires major version bump or coordinated update
- Consumers may have their own viem dependency, so migration should be smooth

### Migration Path for Consumers

Consumers currently need:
```json
"dependencies": {
  "@metamask/x402": "0.1.0",
  "viem": "^2.31.4"
}
```

After change:
```json
"dependencies": {
  "@metamask/x402": "0.2.0"
}
```

No code changes needed for consumers - this is an internal implementation detail.

## Estimated Effort

- **Implementation:** ~2-4 hours
  - Create utility functions
  - Update imports across 2 files
  - Update package.json
  
- **Testing:** ~1-2 hours
  - Run existing test suite
  - Add additional edge case tests if needed
  - Verify checksum behavior matches viem

- **Documentation:** ~1 hour
  - Update CHANGELOG.md
  - Document the change
  - Update any relevant comments

**Total:** ~4-7 hours of development effort

## References

- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [Viem getAddress documentation](https://viem.sh/docs/utilities/getAddress.html)
- [Current x402 package](./packages/x402/)
