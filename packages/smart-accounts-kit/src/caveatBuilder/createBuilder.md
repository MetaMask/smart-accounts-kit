## Task: Create a Caveat Builder for a Caveat Enforcer

You are given the name of a Caveat Enforcer contract.

Follow the instructions below exactly. Do not skip steps. Do not change behavior. Maintain consistency with existing implementations.

---

### File Paths (Relative to Project Root)

- Caveat Enforcer contracts: `/lib/delegatable-framework/src/enforcers/`
- Caveat Builder implementations: `/packages/smart-accounts-kit/src/caveatBuilder/`
- Caveat Builder unit tests: `/packages/smart-accounts-kit/test/caveatBuilder/`
- End-to-end tests: `/packages/delegator-e2e/test/caveats`

---

### Type Constraints

- If a type matches the pattern `0x${string}`, use the `Hex` type from the `viem` package.

---

### Step-by-Step Instructions

1. Locate the `getTermsInfo` function in the specified Caveat Enforcer contract.
   → Determine the encoding format used for the `terms`.

2. Identify the best caller-facing arguments to represent the `terms`.
   → Use other Caveat Builders as references for argument names and types.
   → Match conventions in existing examples.

3. Create a new Caveat Builder file.
   → Implement the builder using the identified arguments and types.

4. Create a test file for the new Caveat Builder.
   → Follow the structure and style used in other Caveat Builder test files.
   → If `terms` has a fixed length, add a test that validates the exact byte length of the encoded `terms`.

5. From the `packages/smart-accounts-kit` directory, run the test:
   `yarn test <path-to-your-test-file>`

6. If tests fail:
   → Debug and fix the implementation.
   → Re-run tests until they pass.

7. Register the new Caveat Builder by updating:
   `/packages/smart-accounts-kit/src/caveatBuilder/index.ts`

8. Write an integration test in the `delegator-e2e` project.
   → Match the structure and approach used in existing integration tests.
   → Do not run the integration test.
   → Constraints for integration tests:

   - Only expect revert messages that come from the Enforcer contract.
   - Always call `expectUserOperationToSucceed` with the `userOperationReceipt`.
   - Do not fund addresses with native token unless explicitly required for the logic under test.
     - Native token is not required for gas.
   - If an ERC20 token is required:
     - Fund source address using `fundAddressWithErc20Token`.
     - Import the ABI using this snippet:
       ```
       import * as ERC20Token from '../../contracts/out/ERC20Token.sol/ERC20Token.json';
       const { abi: erc20TokenAbi } = ERC20Token;
       ```

9. Commit the implementation using a descriptive Git commit message.

---

### End of Instructions
