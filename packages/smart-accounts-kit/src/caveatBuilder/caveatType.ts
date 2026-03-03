/**
 * Caveat types for enforcer functions used in delegations.
 * Can be used when defining caveats either via CaveatBuilder.addCaveat
 * or in the caveats array in createDelegation.
 */
export enum CaveatType {
  AllowedMethods = 'allowedMethods',
  AllowedTargets = 'allowedTargets',
  Deployed = 'deployed',
  AllowedCalldata = 'allowedCalldata',
  Erc20BalanceChange = 'erc20BalanceChange',
  Erc721BalanceChange = 'erc721BalanceChange',
  Erc1155BalanceChange = 'erc1155BalanceChange',
  ValueLte = 'valueLte',
  LimitedCalls = 'limitedCalls',
  Id = 'id',
  Nonce = 'nonce',
  Timestamp = 'timestamp',
  BlockNumber = 'blockNumber',
  Erc20TransferAmount = 'erc20TransferAmount',
  Erc20Streaming = 'erc20Streaming',
  NativeTokenStreaming = 'nativeTokenStreaming',
  Erc721Transfer = 'erc721Transfer',
  NativeTokenTransferAmount = 'nativeTokenTransferAmount',
  NativeBalanceChange = 'nativeBalanceChange',
  Redeemer = 'redeemer',
  NativeTokenPayment = 'nativeTokenPayment',
  ArgsEqualityCheck = 'argsEqualityCheck',
  SpecificActionERC20TransferBatch = 'specificActionERC20TransferBatch',
  Erc20PeriodTransfer = 'erc20PeriodTransfer',
  NativeTokenPeriodTransfer = 'nativeTokenPeriodTransfer',
  ExactCalldataBatch = 'exactCalldataBatch',
  ExactCalldata = 'exactCalldata',
  ExactExecution = 'exactExecution',
  ExactExecutionBatch = 'exactExecutionBatch',
  MultiTokenPeriod = 'multiTokenPeriod',
  OwnershipTransfer = 'ownershipTransfer',
}

/**
 * Represents a caveat type that can be either the enum value or its string representation.
 * This allows both forms:
 * - CaveatType.AllowedMethods (enum)
 * - 'allowedMethods' (string literal)
 */
export type CaveatTypeParam = CaveatType | `${CaveatType}`;
