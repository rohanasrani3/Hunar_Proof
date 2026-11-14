import "server-only";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { initializeLocalDb } from "../../scripts/init-local-db.mjs";
import { ART_FORMS } from "@/contract/artForms";
import { seedSamples } from "./samples";

export type Value = string | number | null;
export type Query = <T = Record<string, unknown>>(sql: string, values?: Value[]) => Promise<T[]>;
interface Database {
  query<T>(sql: string, values?: Value[]): Promise<T[]>;
  transaction<T>(work: (query: Query) => Promise<T>): Promise<T>;
}
const globalDb = globalThis as typeof globalThis & {
  karegharDb?: Promise<Database>;
};

async function connect(): Promise<Database> {
  let database: Database;
  if (process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 4,
    });
    database = {
      async query<T>(sql: string, values: Value[] = []) {
        return Array.from(await client.unsafe(sql, values)) as T[];
      },
      async transaction<T>(work: (query: Query) => Promise<T>): Promise<T> {
        const result = await client.begin(async (connection) => work(async <R>(sql: string, values: Value[] = []) =>
          Array.from(await connection.unsafe(sql, values)) as R[]));
        return result as T;
      },
    };
  } else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KAREGHAR_LOCAL !== "1"
    )
      throw Error("DATABASE_URL required");
    const { DatabaseSync } = await import("node:sqlite");
    const dataDirectory = process.env.KAREGHAR_DATA_DIR || ".kareghar";
    mkdirSync(dataDirectory, { recursive: true });
    const sqlite = new DatabaseSync(join(dataDirectory, "market.db"));
    initializeLocalDb(sqlite);
    const localQuery: Query = async <T>(sql: string, values: Value[] = []) => {
        const ordered: Value[] = [];
        const statement = sql.replace(/\$(\d+)/g, (_, n) => {
          ordered.push(values[Number(n) - 1]);
          return "?";
        });
        return sqlite
          .prepare(statement)
          .all(...ordered)
          .map((row) => ({ ...row })) as T[];
      };
    // All local operations share one queue so asynchronous transaction callbacks
    // cannot accidentally enlist another request in their SQLite transaction.
    let queue: Promise<unknown> = Promise.resolve();
    const serial = <T>(work: () => Promise<T>): Promise<T> => {
      const result = queue.then(work, work);
      queue = result.catch(() => undefined);
      return result;
    };
    database = {
      query: <T>(sql: string, values?: Value[]) => serial(() => localQuery<T>(sql, values)),
      transaction: <T>(work: (query: Query) => Promise<T>) => serial(async () => {
        sqlite.exec("BEGIN IMMEDIATE");
        try {
          const result = await work(localQuery);
          sqlite.exec("COMMIT");
          return result;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      }),
    };
  }
  for (const form of ART_FORMS)
    await database.query(
      "INSERT INTO forms VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
      [form.id, form.category, form.name, form.hi],
    );
  if (!process.env.DATABASE_URL || process.env.KAREGHAR_SEED_SAMPLES === "1")
    await seedSamples((sql, values) => database.query(sql, values));
  return database;
}
export async function transaction<T>(work: (query: Query) => Promise<T>): Promise<T> {
  globalDb.karegharDb ??= connect().catch((error) => {
    delete globalDb.karegharDb;
    throw error;
  });
  return (await globalDb.karegharDb).transaction(work);
}
export async function query<T>(
  sql: string,
  values: Value[] = [],
): Promise<T[]> {
  globalDb.karegharDb ??= connect().catch((error) => {
    delete globalDb.karegharDb;
    throw error;
  });
  return (await globalDb.karegharDb).query<T>(sql, values);
}
