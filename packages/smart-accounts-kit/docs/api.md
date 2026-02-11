# MetaMask Smart Accounts Kit API Reference

## Delegation Encoding Functions

The following functions provide encoding and decoding capabilities for delegations:

### `encodeDelegations(delegations: Delegation[]): Hex`

ABI encodes an array of delegations.

**Parameters:**
- `delegations` - The delegations to encode

**Returns:**
- The encoded delegations as a hex string

### `decodeDelegations(encoded: Hex): Delegation[]`

Decodes an array of delegations from its ABI-encoded representation.

**Parameters:**
- `encoded` - The hex-encoded delegation array to decode

**Returns:**
- An array of decoded delegations

## Deprecated Functions

The following functions have been removed as they provided minimal functional value:

- ~~`encodePermissionContexts`~~ - Use `delegations.map(encodeDelegations)` instead
- ~~`decodePermissionContexts`~~ - Use `encoded.map(decodeDelegations)` instead

These wrapper functions simply applied the core encoding/decoding functions to arrays and added confusion with terminology.