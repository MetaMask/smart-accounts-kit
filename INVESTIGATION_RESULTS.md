# Viem Breaking Change Investigation

## Issue
[MetaMask/smart-accounts-kit#188](https://github.com/MetaMask/smart-accounts-kit/issues/188) describes a breaking change in viem that causes TypeScript errors related to `WebAuthnSignReturnType` where `challengeIndex` became optional (`number | undefined`) instead of required (`number`).

## Root Cause

The breaking change was introduced in **ox@0.6.5** (specifically commit [d11e1fb](https://github.com/wevm/ox/commit/d11e1fbd2554194a67d37c4da34dcf9f749e3698)) on **November 24, 2025**.

## Timeline of Changes

### 1. Account Abstraction Introduction (July 24, 2024)
- **PR**: [wevm/viem#2510](https://github.com/wevm/viem/pull/2510)
- **Commit**: [070c0d1](https://github.com/wevm/viem/commit/070c0d1bd85ff3e77fdaf6b7f4ce4aee8d19c71a)
- Added ERC-4337 Account Abstraction extension to viem
- Introduced dependency on `webauthn-p256@0.0.5`
- At this point, `challengeIndex` was **required** (`number`)

### 2. WebAuthn Type Change in Ox (November 24, 2025)
- **PR**: [wevm/ox (commit d11e1fb)](https://github.com/wevm/ox/commit/d11e1fbd2554194a67d37c4da34dcf9f749e3698)
- **Title**: "feat: modify `WebAuthnP256.verify` to work with minimal metadata"
- **Change**: Modified `SignMetadata` type in `ox/WebAuthnP256` to make several fields optional:
  - `challengeIndex?: number | undefined` (was: `challengeIndex: number`)
  - `typeIndex?: number | undefined` (was: `typeIndex: number`)
  - `userVerificationRequired?: boolean | undefined` (was: `userVerificationRequired: boolean`)

```diff
 export type SignMetadata = Compute<{
   authenticatorData: Hex.Hex
-  challengeIndex: number
+  challengeIndex?: number | undefined
   clientDataJSON: string
-  typeIndex: number
+  typeIndex?: number | undefined
-  userVerificationRequired: boolean
+  userVerificationRequired?: boolean | undefined
 }>
```

This change allowed `WebAuthnP256.verify` to work with only `clientDataJSON` and `authenticatorData`, automatically extracting `challengeIndex` and `typeIndex` when not provided.

### 3. Viem Migration from webauthn-p256 to Ox (January 16, 2025)
- **PR**: [wevm/viem#3232](https://github.com/wevm/viem/pull/3232)
- **Commit**: [e1df486](https://github.com/wevm/viem/commit/e1df486b02e62a9a9890752d42141671c0f37e25)
- Removed `webauthn-p256@0.0.10` dependency
- Migrated to use `ox@0.6.0` for WebAuthn functionality
- **Note**: At the time of this migration, ox@0.6.0 still had `challengeIndex` as **required**

### 4. Viem Ox Version Update (after November 24, 2025)
- Viem updated its `ox` dependency from `0.6.0` to `0.6.5` (or later)
- This update pulled in the breaking change from ox that made `challengeIndex` optional
- This is the version range (viem 2.31.4 to 2.43.5) where smart-accounts-kit started experiencing type errors

## Specific Breaking Change PR

**Repository**: wevm/ox
**PR/Commit**: [d11e1fbd2554194a67d37c4da34dcf9f749e3698](https://github.com/wevm/ox/commit/d11e1fbd2554194a67d37c4da34dcf9f749e3698)
**Date**: November 24, 2025
**Title**: feat: modify `WebAuthnP256.verify` to work with minimal metadata
**Author**: [@jxom](https://github.com/jxom)

### Changes Made

The commit modified the `SignMetadata` type in `src/core/WebAuthnP256.ts` to make `challengeIndex`, `typeIndex`, and `userVerificationRequired` optional. The verification logic was updated to:
1. Automatically extract `challengeIndex` from `clientDataJSON` if not provided
2. Skip `typeIndex` validation if not provided
3. Make `userVerificationRequired` optional

## Impact on smart-accounts-kit

The breaking change manifests as TypeScript errors because code expecting `WebAuthnSignReturnType` with a required `challengeIndex: number` now receives `challengeIndex: number | undefined`. Example error from the issue:

```typescript
error TS2345: Argument of type '({ signature, webauthn }: WebAuthnSignReturnType) => `0x${string}`' is not assignable to parameter of type '(value: WebAuthnSignReturnType) => `0x${string}` | PromiseLike<`0x${string}`>'.
  Types of parameters '__0' and 'value' are incompatible.
    Type 'WebAuthnSignReturnType' is not assignable to type 'SignReturnType'.
      The types of 'webauthn.challengeIndex' are incompatible between these types.
        Type 'number | undefined' is not assignable to type 'number'.
          Type 'undefined' is not assignable to type 'number'.
```

## Recommended Solution

smart-accounts-kit should update its code to handle the optional `challengeIndex`:

1. **Option 1**: Add runtime checks for `challengeIndex` presence
2. **Option 2**: Update type expectations to match the new optional fields
3. **Option 3**: Pin viem to a version before the ox@0.6.5 update (temporary workaround)
4. **Option 4**: Use type assertions or guards to ensure `challengeIndex` is defined when needed

The viem team's rationale for this change was to allow verification with minimal metadata, automatically extracting indices from the `clientDataJSON` when not explicitly provided.
