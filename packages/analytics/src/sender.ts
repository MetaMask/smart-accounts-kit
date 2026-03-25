/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-syntax */
type SenderOptions<T> = {
  batchSize: number;
  baseTimeoutMs: number;
  maxFailureCount: number;
  sendFn: (batch: T[]) => Promise<void>;
};

/**
 * Sender batches events and sends them to a server within a time window,
 * with exponential backoff on errors.
 */
class Sender<T> {
  #isDisabled = false;

  private readonly sendFn: (batch: T[]) => Promise<void>;

  private batch: T[] = [];

  private readonly batchSize: number;

  private readonly baseTimeoutMs: number;

  private readonly maxFailureCount: number;

  private failureCount: number = 0;

  private readonly maxTimeoutMs: number = 30_000;

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  private isSending: boolean = false;

  constructor(options: SenderOptions<T>) {
    this.batchSize = options.batchSize;
    this.baseTimeoutMs = options.baseTimeoutMs;
    this.maxFailureCount = options.maxFailureCount;
    this.sendFn = options.sendFn;
  }

  public enqueue(item: T): void {
    if (this.#isDisabled) {
      return;
    }
    this.batch.push(item);
    this.schedule();
  }

  private schedule(): void {
    if (this.#isDisabled) {
      return;
    }
    if (this.batch.length > 0 && !this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.flush();
      }, this.getTimeoutMs());
    }
  }

  private async flush(): Promise<void> {
    if (this.#isDisabled || this.isSending || this.batch.length === 0) {
      return;
    }

    this.isSending = true;
    const current = [...this.batch.slice(0, this.batchSize)];
    this.batch = this.batch.slice(this.batchSize);

    try {
      await this.sendFn(current);
      this.failureCount = 0;
    } catch (error) {
      this.failureCount += 1;
      if (this.failureCount >= this.maxFailureCount) {
        this.#isDisabled = true;
        this.batch = [];
        if (this.timeoutId !== null) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      } else {
        this.batch = [...current, ...this.batch];
      }
    } finally {
      this.isSending = false;
      this.schedule();
    }
  }

  private getTimeoutMs(): number {
    return Math.min(
      this.baseTimeoutMs * 2 ** this.failureCount,
      this.maxTimeoutMs,
    );
  }
}

export default Sender;
