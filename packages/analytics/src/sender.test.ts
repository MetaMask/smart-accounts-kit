/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable-next-line id-length */
import * as t from 'vitest';

import Sender from './sender';

t.describe('Sender', () => {
  let sendFn: t.Mock<() => Promise<void>>;
  let sender: Sender<string>;

  t.beforeEach(() => {
    t.vi.useFakeTimers();
    sendFn = t.vi.fn().mockResolvedValue(undefined);
    sender = new Sender({
      batchSize: 2,
      baseTimeoutMs: 50,
      maxFailureCount: 10,
      sendFn,
    });
  });

  t.afterEach(() => {
    t.vi.useRealTimers();
    t.vi.clearAllMocks();
  });

  t.it('should flush after timeout', async () => {
    sender.enqueue('event1');
    await t.vi.advanceTimersByTimeAsync(50);
    t.expect(sendFn).toHaveBeenCalledWith(['event1']);
  });

  t.it('should flush twice with correct batch size', async () => {
    sender.enqueue('event1');
    sender.enqueue('event2');
    sender.enqueue('event3');
    t.expect(sendFn).toHaveBeenCalledTimes(0);

    await t.vi.advanceTimersByTimeAsync(50);
    t.expect(sendFn).toHaveBeenCalledTimes(1);
    t.expect(sendFn).toHaveBeenCalledWith(['event1', 'event2']);

    await t.vi.advanceTimersByTimeAsync(50);
    t.expect(sendFn).toHaveBeenCalledTimes(2);
    t.expect(sendFn).toHaveBeenCalledWith(['event3']);
  });

  t.it(
    'should handle failure (with exponential backoff) and reset base timeout after successful send',
    async () => {
      let shouldSendFail = true;
      sendFn = t.vi.fn().mockImplementation(async () => {
        if (shouldSendFail) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve();
      });
      sender = new Sender({
        batchSize: 100,
        baseTimeoutMs: 50,
        maxFailureCount: 100,
        sendFn,
      });

      shouldSendFail = true;

      sender.enqueue('event1');
      t.expect(sendFn).toHaveBeenCalledTimes(0);

      await t.vi.advanceTimersByTimeAsync(50);
      t.expect(sendFn).toHaveBeenCalledTimes(1);
      t.expect(sendFn).toHaveBeenCalledWith(['event1']);

      shouldSendFail = false;

      await t.vi.advanceTimersByTimeAsync(50);
      t.expect(sendFn).toHaveBeenCalledTimes(1);
      await t.vi.advanceTimersByTimeAsync(50);
      t.expect(sendFn).toHaveBeenCalledTimes(2);
      t.expect(sendFn).toHaveBeenCalledWith(['event1']);

      sender.enqueue('event2');
      await t.vi.advanceTimersByTimeAsync(50);
      t.expect(sendFn).toHaveBeenCalledTimes(3);
      t.expect(sendFn).toHaveBeenCalledWith(['event2']);
    },
  );

  t.it(
    'disables and purges when maxFailureCount is reached; enqueue is noop',
    async () => {
      sendFn = t.vi.fn().mockRejectedValue(new Error('Failed'));
      sender = new Sender({
        batchSize: 100,
        baseTimeoutMs: 50,
        maxFailureCount: 2,
        sendFn,
      });

      sender.enqueue('event1');
      await t.vi.advanceTimersByTimeAsync(50);
      t.expect(sendFn).toHaveBeenCalledTimes(1);

      await t.vi.advanceTimersByTimeAsync(100);
      t.expect(sendFn).toHaveBeenCalledTimes(2);

      sender.enqueue('event2');
      await t.vi.advanceTimersByTimeAsync(60_000);
      t.expect(sendFn).toHaveBeenCalledTimes(2);
    },
  );

  t.it('should handle concurrent sends properly', async () => {
    let resolveSend!: (value?: unknown) => void;
    sendFn = t.vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => {
        resolveSend = resolve;
      });
    });
    sender = new Sender({
      batchSize: 100,
      baseTimeoutMs: 1000,
      maxFailureCount: 100,
      sendFn,
    });

    sender.enqueue('event1');
    await t.vi.advanceTimersByTimeAsync(1000);
    t.expect(sendFn).toHaveBeenCalledWith(['event1']);
    t.expect(sendFn).toHaveBeenCalledTimes(1);

    sender.enqueue('event2');
    resolveSend();
    await Promise.resolve();

    await t.vi.advanceTimersByTimeAsync(1000);
    t.expect(sendFn).toHaveBeenCalledWith(['event2']);
    t.expect(sendFn).toHaveBeenCalledTimes(2);
  });
});
