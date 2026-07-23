/**
 * Executes an async operation with automatic retry logic for transient errors.
 * Never retries non-transient errors (400, 401, 403, 404, 409 validation/permission errors).
 */
export async function withRetry(fn, maxRetries = 3, delayMs = 500) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err?.code || err?.status || 500;
      const isTransient =
        status === 429 || status >= 500 || err?.message?.includes('fetch failed') || err?.message?.includes('timeout');

      if (!isTransient || attempt >= maxRetries) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}
