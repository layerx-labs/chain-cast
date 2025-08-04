/**
 * Creates a promise that resolves after a specified number of milliseconds.
 *
 * This utility function provides a simple way to introduce delays in asynchronous
 * operations. It's commonly used for rate limiting, polling, or implementing
 * retry logic with delays between attempts.
 *
 * @param ms - The number of milliseconds to wait before resolving the promise
 * @returns A promise that resolves after the specified delay
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
