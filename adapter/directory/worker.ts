/// <reference lib="webworker" />

import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

let SQL: any = null;
let db: any = null;

function reply(id: number, result?: any, error?: string) {
  workerScope.postMessage({ id, result, error });
}

async function openDatabase(bytes?: Uint8Array) {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: () => wasmUrl });
  }

  if (db) {
    db.close();
    db = null;
  }

  db = bytes && bytes.byteLength > 0 ? new SQL.Database(bytes) : new SQL.Database();
  db.run('PRAGMA foreign_keys=ON');
  // Snapshot files are committed atomically; WAL would leave sidecar files that
  // are not part of the OpenNotas folder protocol.
  db.run('PRAGMA journal_mode=DELETE');
}

workerScope.onmessage = async (event: MessageEvent) => {
  const { id, type, sql, params, bytes } = event.data || {};
  try {
    switch (type) {
      case 'open': {
        await openDatabase(bytes);
        reply(id, { ready: true });
        break;
      }
      case 'run': {
        if (!db) throw new Error('Database is not open');
        db.run(sql, params || []);
        reply(id, { rows: [] });
        break;
      }
      case 'all': {
        if (!db) throw new Error('Database is not open');
        const statement = db.prepare(sql);
        try {
          if (params?.length) statement.bind(params);
          const rows: any[] = [];
          while (statement.step()) rows.push(statement.getAsObject());
          reply(id, { rows });
        } finally {
          statement.free();
        }
        break;
      }
      case 'script': {
        if (!db) throw new Error('Database is not open');
        db.exec(sql);
        reply(id, { rows: [] });
        break;
      }
      case 'export': {
        if (!db) throw new Error('Database is not open');
        const exported = db.export();
        workerScope.postMessage({ id, result: { bytes: exported } }, [exported.buffer]);
        break;
      }
      case 'close': {
        if (db) {
          db.close();
          db = null;
        }
        reply(id, { closed: true });
        break;
      }
      default:
        throw new Error(`Unknown worker message: ${type}`);
    }
  } catch (error: any) {
    reply(id, undefined, error?.message || String(error));
  }
};
