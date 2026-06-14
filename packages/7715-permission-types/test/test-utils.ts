export const toWord = (value: bigint | number): string =>
  BigInt(value).toString(16).padStart(64, '0');
