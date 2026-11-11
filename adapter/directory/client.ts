// Tiny promise-based RPC around the SQLite worker. No Comlink dependency: the
// protocol is small and every call already returns a Promise.

type Pending = {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

class SqliteWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent) => {
      const { id, result, error } = event.data || {};
      const pending = this.pending.get(id);
      if (!pending) return;
      this.pending.delete(id);
      if (error) pending.reject(new Error(error));
      else pending.resolve(result);
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || 'SQLite worker failed');
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
      this.worker = null;
    };
    return this.worker;
  }

  private request(type: string, payload: Record<string, any> = {}): Promise<any> {
    const worker = this.ensureWorker();
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, ...payload });
    });
  }

  async open(bytes?: Uint8Array): Promise<void> {
    await this.request('open', { bytes });
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    await this.request('run', { sql, params });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.request('all', { sql, params });
    return result?.rows || [];
  }

  async script(sql: string): Promise<void> {
    await this.request('script', { sql });
  }

  async export(): Promise<Uint8Array> {
    const result = await this.request('export');
    const raw = result?.bytes instanceof Uint8Array
      ? result.bytes
      : new Uint8Array(result?.bytes || []);
    // sql.js returns a view into its internal buffer; return an owned copy so a
    // transferred buffer cannot detach the database's backing store.
    return raw.slice();
  }

  async close(): Promise<void> {
    if (!this.worker) return;
    try {
      await this.request('close');
    } finally {
      this.worker.terminate();
      this.worker = null;
      this.pending.clear();
    }
  }
}

export default SqliteWorkerClient;
