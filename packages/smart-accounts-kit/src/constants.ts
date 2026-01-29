/**
 * To be used in sdk methods to call Implementation specific code
 *
 */
export enum Implementation {
  MultiSig = 'MultiSig',
  Hybrid = 'Hybrid',
  Stateless7702 = 'Stateless7702',
}

/**
 * Represents predefined time intervals (in seconds) for transfer windows.
 * These values are commonly used to specify the duration of transfer periods,
 * such as hourly, daily, weekly, etc., where each enum member's value is the
 * number of seconds in that interval.
 *
 * Hourly - 1 hour (3600 seconds)
 *
 * Daily - 1 day (86400 seconds)
 *
 * Weekly - 1 week (604800 seconds)
 *
 * BiWeekly - 2 weeks (1209600 seconds)
 *
 * Monthly - 1 month (30 days, 2592000 seconds)
 *
 * Quarterly - 1 quarter (90 days, 7776000 seconds)
 *
 * Yearly - 1 year (365 days, 31536000 seconds)
 */
export enum TransferWindow {
  Hourly = 3600, // 60 * 60 (seconds)
  Daily = 86400, // 60 * 60 * 24 (seconds)
  Weekly = 604800, // 60 * 60 * 24 * 7 (seconds)
  BiWeekly = 1209600, // 60 * 60 * 24 * 14 (seconds)
  Monthly = 2592000, // 60 * 60 * 24 * 30 (seconds)
  Quarterly = 7776000, // 60 * 60 * 24 * 90 (seconds)
  Yearly = 31536000, // 60 * 60 * 24 * 365 (seconds)
}

/**
 * Scope types for configuring delegation permissions.
 * Used with createCaveatBuilderFromScope to specify the type of permission scope.
 */
export enum ScopeType {
  Erc20TransferAmount = 'erc20TransferAmount',
  Erc20Streaming = 'erc20Streaming',
  Erc20PeriodTransfer = 'erc20PeriodTransfer',
  NativeTokenTransferAmount = 'nativeTokenTransferAmount',
  NativeTokenStreaming = 'nativeTokenStreaming',
  NativeTokenPeriodTransfer = 'nativeTokenPeriodTransfer',
  Erc721Transfer = 'erc721Transfer',
  OwnershipTransfer = 'ownershipTransfer',
  FunctionCall = 'functionCall',
}
