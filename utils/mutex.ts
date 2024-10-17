class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire() {
    return new Promise<void>((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      if (nextResolve) nextResolve();
    } else {
      this.locked = false;
    }
  }
}

export default Mutex;
