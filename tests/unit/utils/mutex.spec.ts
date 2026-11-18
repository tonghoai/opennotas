import { describe, expect, it } from 'vitest';
import Mutex from '~/utils/mutex';

describe('Mutex', () => {
  it('serializes concurrent acquisitions in FIFO order', async () => {
    const mutex = new Mutex();
    const order: string[] = [];

    await mutex.acquire();
    const second = mutex.acquire().then(() => order.push('second'));
    const third = mutex.acquire().then(() => order.push('third'));

    expect(order).toEqual([]);
    mutex.release();
    await second;
    expect(order).toEqual(['second']);
    mutex.release();
    await third;
    expect(order).toEqual(['second', 'third']);
    mutex.release();
  });
});
