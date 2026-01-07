import log from '@/services/log';

/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * Useful for implementing delays in asynchronous operations.
 *
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the specified delay
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retries an asynchronous function call with exponential backoff.
 * Automatically retries failed operations up to a maximum number of attempts
 * with a configurable delay between retries.
 *
 * @template T - Function type to retry
 * @param fn - The async function to retry
 * @param args - Arguments to pass to the function
 * @param maxTry - Maximum number of retry attempts
 * @param delaySec - Delay in seconds between retry attempts
 * @param retryCount - Current retry attempt number (used internally for recursion)
 * @returns Promise that resolves with the function result or rejects after all retries exhausted
 */
export async function retry<T extends (...args: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxTry: number,
  delaySec: number,
  retryCount = 1
): Promise<Awaited<ReturnType<T>>> {
  // Ensure retry count is a valid number
  const currRetry = typeof retryCount === 'number' ? retryCount : 1;

  try {
    // Attempt to execute the function
    const result = await fn(...args);
    return result;
  } catch (e: unknown) {
    // Log the retry attempt and error
    const error = e as Error;
    log.d(`Retry ${currRetry} failed. ${error.message}`);

    // If we've exceeded max retries, throw the error
    if (currRetry > maxTry) {
      log.d(`All ${maxTry} retry attempts exhausted`);
      throw e;
    }

    // Wait before retrying, then recursively call retry with incremented count
    await wait(delaySec * 1000);
    return retry(fn, args, maxTry, delaySec, currRetry + 1);
  }
}
