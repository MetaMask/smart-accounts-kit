import { type Hex, isHex, toHex } from 'viem';

/**
 * Checks if two hexadecimal strings are equal, ignoring case sensitivity.
 *
 * @param a - The first hexadecimal string.
 * @param b - The second hexadecimal string.
 * @returns True if the hexadecimal strings are equal, false otherwise.
 */
export function isEqualHex(a: Hex, b: Hex): boolean {
  return isHex(a) && a.toLowerCase() === b.toLowerCase();
}

/**
 * Recursively converts all members of an object to hexadecimal format.
 * Handles various data types including functions, null, strings, booleans,
 * bigints, arrays, and objects.
 *
 * @param obj - The object to convert to hexadecimal format.
 * @returns The object with all values converted to hexadecimal format.
 */
export function deepHexlify(obj: any): any {
  if (typeof obj === 'function') {
    return undefined;
  }

  if (
    obj === null ||
    obj === undefined ||
    typeof obj === 'string' ||
    typeof obj === 'boolean'
  ) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return toHex(obj);
  }

  if (obj._isBigNumber !== null || typeof obj !== 'object') {
    return toHex(obj).replace(/^0x0/u, '0x');
  }

  if (Array.isArray(obj)) {
    return obj.map((member) => deepHexlify(member));
  }

  return Object.keys(obj).reduce(
    (set, key) =>
      Object.assign(Object.assign({}, set), {
        [key]: deepHexlify(obj[key]),
      }),
    {},
  );
}

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
