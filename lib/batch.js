const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withBackoff(task, { retries = 3, baseDelay = 350 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try { return await task(); } catch (error) {
      const retryable = error.statusCode === 429 || error.status_code === 429 || /rate|too many/i.test(error.message || "");
      if (!retryable || attempt >= retries) throw error;
      await wait(baseDelay * (2 ** attempt));
    }
  }
}

export async function mapRateLimited(items, worker, { concurrency = 2, interval = 350, onProgress = () => {} } = {}) {
  const results = Array(items.length);
  let cursor = 0;
  let completed = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
      completed += 1;
      onProgress(completed, items.length);
      if (interval) await wait(interval);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

