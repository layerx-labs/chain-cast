/**
 * Converts all bigint values in an object to strings, including nested values.
 * Handles nested objects, arrays, and mixed data structures.
 *
 * @param obj - The object to process
 * @returns A new object with all bigint values converted to strings
 */
export function bigIntToString<T>(obj: T): T {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle bigint type
  if (typeof obj === 'bigint') {
    return String(obj) as T;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => bigIntToString(item)) as T;
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = bigIntToString(obj[key]);
      }
    }

    return result as T;
  }

  // Return primitive values as-is (string, number, boolean, etc.)
  return obj;
}