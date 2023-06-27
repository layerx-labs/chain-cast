import log from '@/services/log';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T extends (...args: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxTry: number,
  delaySec: number,
  retryCount = 1
): Promise<Awaited<ReturnType<T>>> {
  const currRetry = typeof retryCount === 'number' ? retryCount : 1;
  try {
    const result = await fn(...args);
    return result;
  } catch (e: Error | any) {
    log.d(`Retry ${currRetry} failed. ${e.message}`);
    if (currRetry > maxTry) {
      log.d(`All ${maxTry} retry attempts exhausted`);
      throw e;
    }
    await wait(delaySec * 1000);
    return retry(fn, args, maxTry, delaySec, currRetry + 1);
  }
}
