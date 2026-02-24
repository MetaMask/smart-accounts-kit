import { type Hex, isHex, toHex } from 'viem';

/**
 * Utility function to check if an object has all specified properties defined and not undefined.
 *
 * @template TObject - The type of the object to check.
 * @template TKey - The keys of the properties to check for.
 * @param object - The object to check for the required properties.
 * @param properties - An array of property names to verify on the object.
 * @returns True if all specified properties exist on the object and are not undefined, otherwise false.
 */
export const hasProperties = <
  TObject extends Record<string, any>,
  TKey extends keyof TObject,
>(
  object: TObject,
  properties: readonly TKey[],
): object is TObject & Record<TKey, NonNullable<TObject[TKey]>> => {
  return properties.every(
    (prop) => prop in object && object[prop] !== undefined,
  );
};

/**
 * Checks if a value is defined (not null or undefined).
 *
 * @param value - The value to check.
 * @returns A boolean indicating whether the value is defined.
 */
export function isDefined<TValue>(
  value: TValue | null | undefined,
): value is TValue {
  return value !== undefined && value !== null;
}

/**
 * Asserts that a value is defined (not null or undefined).
 *
 * @param value - The value to check.
 * @param parameterName - Optional: The name of the parameter that is being checked.
 * @throws {Error} If the value is null or undefined.
 */
export function assertIsDefined<TValue>(
  value: TValue | null | undefined,
  parameterName?: string,
): asserts value is TValue {
  if (!isDefined(value)) {
    throw new Error(
      `Invalid parameters: ${parameterName ?? 'value'} is required`,
    );
  }
}

/**
 * Converts a value to a hex string or throws an error if the value is invalid.
 *
 * @param value - The value to convert to hex.
 * @param parameterName - Optional: The name of the parameter that is being converted to hex.
 * @returns The value as a hex string.
 */
export function toHexOrThrow(
  value: Parameters<typeof toHex>[0] | undefined,
  parameterName?: string,
): Hex {
  assertIsDefined(value, parameterName);

  if (typeof value === 'string') {
    if (!isHex(value)) {
      throw new Error(
        `Invalid parameters: ${parameterName ?? 'value'} is not a valid hex value`,
      );
    }
    return value;
  }

  return toHex(value);
}
