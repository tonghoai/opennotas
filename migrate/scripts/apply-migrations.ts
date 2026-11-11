import localforage from "localforage";

// Each user hosts their own Turso DB (config comes from settings.sync.configuration),
// so schema migrations must be applied by the client against that DB, not by a central CI job.
const migrationModules = import.meta.glob<string>(
  "../../adapter/turso/migrations/*.sql",
  { eager: true, query: "?raw", import: "default" }
);

// One entry per migration file, in order; each entry is the list of SQL statements in that file.
const migrations: string[][] = Object.keys(migrationModules)
  .sort()
  .map((path) =>
    (migrationModules[path] as string)
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean)
  );

// Derived from the number of bundled migration files, so it bumps automatically
// whenever a new `000N_*.sql` file is added — no constant to remember to update.
const CURRENT_SCHEMA_VERSION = migrations.length;

const VERIFIED_VERSION_KEY = "tursoSchemaVerifiedVersion";

let migrationInFlight: Promise<void> | null = null;

function isBenignSchemaError(error: any): boolean {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("already exists") || message.includes("duplicate column");
}

async function readRemoteSchemaVersion(client: any): Promise<number> {
  try {
    const result = await client.execute("SELECT schemaVersion FROM settings LIMIT 1");
    const version = result.rows?.[0]?.schemaVersion;
    return version ? Number(version) : 0;
  } catch (error) {
    // Pre-existing DB from before schemaVersion tracking existed (column/table not there yet).
    return 0;
  }
}

async function writeRemoteSchemaVersion(client: any, version: number): Promise<void> {
  await client.execute({
    sql: "INSERT INTO settings (id, schemaVersion) VALUES ('settings', ?) ON CONFLICT(id) DO UPDATE SET schemaVersion = ?",
    args: [version, version],
  });
}

async function runPendingMigrations(client: any, verifiedVersionKey: string | null = VERIFIED_VERSION_KEY): Promise<void> {
  const remoteVersion = await readRemoteSchemaVersion(client);

  for (let version = remoteVersion; version < CURRENT_SCHEMA_VERSION; version++) {
    for (const statement of migrations[version]) {
      try {
        await client.execute(statement);
      } catch (error) {
        if (!isBenignSchemaError(error)) {
          throw error;
        }
      }
    }
  }

  await writeRemoteSchemaVersion(client, CURRENT_SCHEMA_VERSION);
  if (verifiedVersionKey) {
    await localforage.setItem(verifiedVersionKey, CURRENT_SCHEMA_VERSION);
  }
}

// Skips the remote check entirely once this device already knows it's on the latest
// bundled schema — only re-checks Turso when the app itself ships a new migration.
async function applySchemaMigrations(client: any, options: { verifiedVersionKey?: string | null } = {}): Promise<void> {
  const verifiedVersionKey = options.verifiedVersionKey === undefined
    ? VERIFIED_VERSION_KEY
    : options.verifiedVersionKey;

  // Local SQLite files are the source of truth for their own schema, so callers can opt
  // out of the localforage fast-path (null) and always inspect the database itself.
  if (verifiedVersionKey) {
    const verifiedVersion = await localforage.getItem<number>(verifiedVersionKey);
    if (verifiedVersion === CURRENT_SCHEMA_VERSION) {
      return;
    }
  }

  // The local SQLite adapter passes null because each file owns its schema; run its
  // migrations directly. Turso keeps the shared in-flight guard for the remote client.
  if (verifiedVersionKey && migrationInFlight) {
    return migrationInFlight;
  }

  const flight = runPendingMigrations(client, verifiedVersionKey);
  if (verifiedVersionKey) {
    migrationInFlight = flight.finally(() => {
      migrationInFlight = null;
    });
    return migrationInFlight;
  }

  return flight;
}

export { applySchemaMigrations, CURRENT_SCHEMA_VERSION };
