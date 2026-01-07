/**
 * Retrieves a nested property value from an object using a dot-notation path string.
 * This function enables accessing deeply nested object properties using path strings
 * like "user.profile.name" or "event.args.0", which is useful in virtual machine
 * instruction processing where variables may be accessed dynamically.
 *
 * @param path - Dot-separated path string (e.g., "user.name", "data.items.0.value")
 * @param obj - The object to traverse for the property value
 * @returns The value at the specified path, or null if the path doesn't exist
 *
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: "Alice" } } };
 * getVariableFromPath("user.profile.name", obj); // Returns "Alice"
 * getVariableFromPath("user.email", obj); // Returns null
 * ```
 */
export function getVariableFromPath(path: string, obj: any): any {
  // Split path into segments and filter out empty strings
  const segments = path.split('.').filter(Boolean);

  // If there are multiple segments remaining and object exists
  if (obj && segments.length > 1) {
    // Recursively traverse to the next level of nesting
    const relativePath = segments.slice(1).join('.');
    return getVariableFromPath(relativePath, obj[segments[0]]);

    // If there's one segment and the property exists on the object
  } else if (obj && obj[segments[0]]) {
    return obj[segments[0]];

    // Path doesn't exist in the object
  } else {
    return null;
  }
  if (obj?.[segments[0]]) {
    return obj[segments[0]];

    // Path doesn't exist in the object
  }
  return null;
}
