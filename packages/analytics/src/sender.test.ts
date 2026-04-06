import type { Mock } from 'vitest';
import { describe, beforeEach, afterEach, it, vi, expect } from 'vitest';

import { Sender } from './sender';

describe('Sender', () => {
  let sendFn: Mock<() => Promise<void>>;
  let sender: Sender<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    sendFn = vi.fn().mockResolvedValue(undefined);
    sender = new Sender({
      batchSize: 2,
      baseTimeoutMs: 50,
      maxFailureCount: 10,
      maxTimeoutMs: 30_000,
      sendFn,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should flush after timeout', async () => {
    sender.enqueue('event1');
    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledWith(['event1']);
  });

  it('should flush twice with correct batch size', async () => {
    sender.enqueue('event1');
    sender.enqueue('event2');
    sender.enqueue('event3');
    expect(sendFn).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(sendFn).toHaveBeenCalledWith(['event1', 'event2']);

    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(2);
    expect(sendFn).toHaveBeenCalledWith(['event3']);
  });

  it('should handle failure (with exponential backoff) and reset base timeout after successful send', async () => {
    let shouldSendFail = true;
    sendFn = vi.fn().mockImplementation(async () => {
      if (shouldSendFail) {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve();
    });
    sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 50,
      maxFailureCount: 100,
      maxTimeoutMs: 30_000,
      sendFn,
    });

    shouldSendFail = true;

    sender.enqueue('event1');
    expect(sendFn).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(sendFn).toHaveBeenCalledWith(['event1']);

    shouldSendFail = false;

    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(2);
    expect(sendFn).toHaveBeenCalledWith(['event1']);

    sender.enqueue('event2');
    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(3);
    expect(sendFn).toHaveBeenCalledWith(['event2']);
  });

  it('disables and purges when maxFailureCount is reached; enqueue is noop', async () => {
    sendFn = vi.fn().mockRejectedValue(new Error('Failed'));
    sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 50,
      maxFailureCount: 2,
      maxTimeoutMs: 30_000,
      sendFn,
    });

    sender.enqueue('event1');
    await vi.advanceTimersByTimeAsync(50);
    expect(sendFn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(sendFn).toHaveBeenCalledTimes(2);

    sender.enqueue('event2');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sendFn).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent sends properly', async () => {
    let resolveSend!: (value?: unknown) => void;
    sendFn = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => {
        resolveSend = resolve;
      });
    });
    sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 1000,
      maxFailureCount: 100,
      maxTimeoutMs: 30_000,
      sendFn,
    });

    sender.enqueue('event1');
    await vi.advanceTimersByTimeAsync(1000);
    expect(sendFn).toHaveBeenCalledWith(['event1']);
    expect(sendFn).toHaveBeenCalledTimes(1);

    sender.enqueue('event2');
    resolveSend();
    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(1000);
    expect(sendFn).toHaveBeenCalledWith(['event2']);
    expect(sendFn).toHaveBeenCalledTimes(2);
  });
});
