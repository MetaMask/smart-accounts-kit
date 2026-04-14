# @metamask/delegation-core

Core utilities for creating and managing delegation terms and caveats in the MetaMask Delegation Framework.

## Installation

```bash
npm install @metamask/delegation-core
```

or

```bash
yarn add @metamask/delegation-core
```

## Overview

This package provides utilities for:

- Creating caveat terms for various delegation constraints
- Encoding and decoding delegations
- Type definitions for delegation structures

## API Reference

### Caveat Terms Builders

Caveat terms builders create encoded parameters for different types of delegation constraints.

#### `createValueLteTerms(terms, options?)`

Creates terms for a ValueLte caveat that limits the maximum value of native tokens that can be spent.

**Parameters:**

- `terms: ValueLteTerms`
  - `maxValue: bigint` - The maximum value allowed for the transaction
- `options?: EncodingOptions` - Optional encoding options (`'hex'` | `'bytes'`)

**Returns:** `Hex | Uint8Array` - 32-byte encoded terms

**Example:**

```typescript
import { createValueLteTerms } from '@metamask/delegation-core';

// Limit to 1 ETH maximum
const terms = createValueLteTerms({
  maxValue: 1000000000000000000n, // 1 ETH in wei
});
// Returns: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'

// Get as Uint8Array
const bytesTerms = createValueLteTerms(
  {
    maxValue: 1000000000000000000n,
  },
  { out: 'bytes' },
);
```

#### `createTimestampTerms(terms, options?)`

Creates terms for a Timestamp caveat that enforces time-based constraints on delegation usage.

**Parameters:**

- `terms: TimestampTerms`
  - `afterThreshold: number` - Timestamp (seconds) after which delegation can be used
  - `beforeThreshold: number` - Timestamp (seconds) before which delegation can be used
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - 32-byte encoded terms (16 bytes per timestamp)

**Example:**

```typescript
import { createTimestampTerms } from '@metamask/delegation-core';

// Valid between Jan 1, 2022 and Jan 1, 2023
const terms = createTimestampTerms({
  afterThreshold: 1640995200, // 2022-01-01 00:00:00 UTC
  beforeThreshold: 1672531200, // 2023-01-01 00:00:00 UTC
});

// Only valid after a certain time (no end time)
const openEndedTerms = createTimestampTerms({
  afterThreshold: 1640995200,
  beforeThreshold: 0,
});
```

#### `createExactCalldataTerms(terms, options?)`

Creates terms for an ExactCalldata caveat that ensures execution calldata matches exactly.

**Parameters:**

- `terms: ExactCalldataTerms`
  - `calldata: BytesLike` - The expected calldata (hex string or Uint8Array)
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - The calldata itself (variable length)

**Example:**

```typescript
import { createExactCalldataTerms } from '@metamask/delegation-core';

// Exact calldata for a specific function call
const terms = createExactCalldataTerms({
  calldata:
    '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40ec49b0e8baa5e0000000000000000000000000000000000000000000000000de0b6b3a7640000',
});

// From Uint8Array
const terms2 = createExactCalldataTerms({
  calldata: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb /* ... */]),
});
```

#### `createNativeTokenPeriodTransferTerms(terms, options?)`

Creates terms for periodic native token transfer limits with time-based resets.

**Parameters:**

- `terms: NativeTokenPeriodTransferTerms`
  - `periodAmount: bigint` - Maximum amount transferable per period (wei)
  - `periodDuration: number` - Duration of each period (seconds)
  - `startDate: number` - Unix timestamp when first period begins
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - 96-byte encoded terms (32 bytes per parameter)

**Example:**

```typescript
import { createNativeTokenPeriodTransferTerms } from '@metamask/delegation-core';

// Allow 1 ETH per day starting from a specific date
const terms = createNativeTokenPeriodTransferTerms({
  periodAmount: 1000000000000000000n, // 1 ETH in wei
  periodDuration: 86400, // 24 hours in seconds
  startDate: 1640995200, // 2022-01-01 00:00:00 UTC
});
```

#### `createNativeTokenStreamingTerms(terms, options?)`

Creates terms for linear streaming allowance of native tokens.

**Parameters:**

- `terms: NativeTokenStreamingTerms`
  - `initialAmount: bigint` - Amount available immediately (wei)
  - `maxAmount: bigint` - Maximum total transferable amount (wei)
  - `amountPerSecond: bigint` - Rate of allowance increase per second (wei)
  - `startTime: number` - Unix timestamp when streaming begins
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - 128-byte encoded terms (32 bytes per parameter)

**Example:**

```typescript
import { createNativeTokenStreamingTerms } from '@metamask/delegation-core';

// Stream 0.5 ETH per second, starting with 1 ETH, max 10 ETH
const terms = createNativeTokenStreamingTerms({
  initialAmount: 1000000000000000000n, // 1 ETH available immediately
  maxAmount: 10000000000000000000n, // 10 ETH maximum
  amountPerSecond: 500000000000000000n, // 0.5 ETH per second
  startTime: 1640995200, // Start streaming at this time
});
```

#### `createERC20StreamingTerms(terms, options?)`

Creates terms for linear streaming allowance of ERC20 tokens.

**Parameters:**

- `terms: ERC20StreamingTerms`
  - `tokenAddress: string` - ERC20 token contract address
  - `initialAmount: bigint` - Amount available immediately
  - `maxAmount: bigint` - Maximum total transferable amount
  - `amountPerSecond: bigint` - Rate of allowance increase per second
  - `startTime: number` - Unix timestamp when streaming begins
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - 148-byte encoded terms (20 bytes + 32 bytes × 4 parameters)

**Example:**

```typescript
import { createERC20StreamingTerms } from '@metamask/delegation-core';

// Stream USDC tokens
const terms = createERC20StreamingTerms({
  tokenAddress: '0xA0b86a33E6441E74C65c6BF2A6d73B895B9b34A2',
  initialAmount: 1000000n, // 1 USDC (6 decimals)
  maxAmount: 10000000n, // 10 USDC maximum
  amountPerSecond: 100000n, // 0.1 USDC per second
  startTime: 1640995200,
});
```

#### `createERC20TokenPeriodTransferTerms(terms, options?)`

Creates terms for an ERC20TokenPeriodTransfer caveat that validates that ERC20 token transfers do not exceed a specified amount within a given time period.

**Parameters:**

- `terms: ERC20TokenPeriodTransferTerms`
  - `tokenAddress: BytesLike` - The address of the ERC20 token.
  - `periodAmount: bigint` - The maximum amount that can be transferred within each period.
  - `periodDuration: number` - The duration of each period in seconds.
  - `startDate: number` - Unix timestamp when the first period begins.
- `options?: EncodingOptions` - Optional encoding options

**Returns:** `Hex | Uint8Array` - 116-byte encoded terms (20 bytes for address + 32 bytes per parameter)

**Example:**

```typescript
import { createERC20TokenPeriodTransferTerms } from '@metamask/delegation-core';

// Allow 100 tokens per day starting from a specific date
const terms = createERC20TokenPeriodTransferTerms({
  tokenAddress: '0xA0b86a33E6441E74C65c6BF2A6d73B895B9b34A2',
  periodAmount: 100n, // 100 tokens
  periodDuration: 86400, // 24 hours in seconds
  startDate: 1640995200, // 2022-01-01 00:00:00 UTC
});
```

### Delegation Utilities

#### `encodeDelegations(delegations)`

Encodes an array of delegations into a format suitable for on-chain submission.

**Parameters:**

- `delegations: Delegation[]` - Array of delegation objects

**Returns:** Encoded delegation data

**Example:**

```typescript
import { encodeDelegations } from '@metamask/delegation-core';

const delegations = [
  {
    delegate: '0x742d35Cc6634C0532925a3b8d40EC49b0e8BaA5e',
    delegator: '0x...',
    authority: '0x...',
    caveats: [],
    salt: 0n,
    signature: '0x...',
  },
];

const encoded = encodeDelegations(delegations);
```

#### `decodeDelegations(data)`

Decodes encoded delegation data back into delegation objects.

**Parameters:**

- `data` - Encoded delegation data

**Returns:** `Delegation[]` - Array of decoded delegation objects

**Example:**

```typescript
import { decodeDelegations } from '@metamask/delegation-core';

const delegations = decodeDelegations(encodedData);
```

#### `ROOT_AUTHORITY`

A constant representing the root authority in the delegation hierarchy.

**Example:**

```typescript
import { ROOT_AUTHORITY } from '@metamask/delegation-core';

console.log(ROOT_AUTHORITY); // Root authority identifier
```

#### `hashDelegation(delegation)`

Computes a hash for a given delegation object.

**Parameters:**

- `delegation: DelegationStruct` - The delegation object to hash

**Returns:** `Hex` - The hash of the delegation

**Example:**

```typescript
import { hashDelegation } from '@metamask/delegation-core';

const delegation = {
  delegate: '0x742d35Cc6634C0532925a3b8d40EC49b0e8BaA5e',
  delegator: '0x...',
  authority: '0x...',
  caveats: [],
  salt: 0n,
  signature: '0x...',
};

const hash = hashDelegation(delegation);
```

## Type Definitions

### Core Types

```typescript
export type Hex = `0x${string}`;

export type DelegationStruct = {
  delegate: string;
  delegator: string;
  authority: string;
  caveats: CaveatStruct[];
  salt: bigint;
  signature: string;
};

export type CaveatStruct = {
  enforcer: string;
  terms: string;
};
```

### Caveat Terms Types

```typescript
export type ValueLteTerms = {
  maxValue: bigint;
};

export type TimestampTerms = {
  afterThreshold: number;
  beforeThreshold: number;
};

export type ExactCalldataTerms = {
  calldata: BytesLike;
};

export type NativeTokenPeriodTransferTerms = {
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

export type NativeTokenStreamingTerms = {
  initialAmount: bigint;
  maxAmount: bigint;
  amountPerSecond: bigint;
  startTime: number;
};

export type ERC20StreamingTerms = {
  tokenAddress: BytesLike;
  initialAmount: bigint;
  maxAmount: bigint;
  amountPerSecond: bigint;
  startTime: number;
};
```

## Error Handling

All caveat builders include validation and will throw descriptive errors:

```typescript
try {
  const terms = createValueLteTerms({
    maxValue: -1n, // Invalid: negative value
  });
} catch (error) {
  console.error(error.message); // "Invalid maxValue: must be greater than or equal to zero"
}
```

## Related Packages

- `@metamask/smart-accounts-kit` - Higher-level utilities for delegation management
- `@metamask/delegation-abis` - Contract ABIs for the delegation framework
- `@metamask/delegation-deployments` - Contract deployment addresses

## Links

- [MetaMask Delegation Framework](https://github.com/MetaMask/delegation-framework)
- [EIP-7715: Delegated Authorization](https://eips.ethereum.org/EIPS/eip-7715)
