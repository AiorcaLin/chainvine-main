// Client RPC tool
import { ethers } from "ethers";
import { createCache } from "./performance";
import { getRpcUrl } from "@/utils/chainServices"; // Import new getRpcUrl

// Create RPC response cache
const rpcCache = createCache<any>();

// Optimized RPC tool
export function getRpcUrlOptimized(chain: string): string {
  return getRpcUrl(chain); // Use new getRpcUrl
}

type RetryFunction<T> = () => Promise<T>;

export async function withRetry<T>(
  fn: RetryFunction<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
    }
  }

  throw lastError || new Error("Max retries reached");
}

// Batch request processor
export class BatchRequestHandler {
  private queue: Array<{
    method: string;
    params: any[];
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private provider: ethers.JsonRpcProvider,
    private batchSize: number = 10,
    private delay: number = 50
  ) {}

  public async addRequest(method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ method, params, resolve, reject });
      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.timeout) return;

    this.timeout = setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }

  private async processBatch() {
    const batch = this.queue.splice(0, this.batchSize);
    this.timeout = null;

    if (batch.length === 0) return;

    try {
      const results = await this.provider.send(
        "eth_batch",
        batch.map(({ method, params }) => ({
          jsonrpc: "2.0",
          id: Math.random(),
          method,
          params,
        }))
      );

      results.forEach((result: any, i: number) => {
        if (result.error) {
          batch[i].reject(result.error);
        } else {
          batch[i].resolve(result.result);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}
