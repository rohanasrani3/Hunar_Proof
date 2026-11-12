import "server-only";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { initializeLocalDb } from "../../scripts/init-local-db.mjs";
import { ART_FORMS } from "@/contract/artForms";
import { seedSamples } from "./samples";

type Value = string | number | null;
interface Database {
  query<T>(sql: string, values?: Value[]): Promise<T[]>;
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
    };
  } else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KAREGHAR_LOCAL !== "1"
    )
      throw Error("DATABASE_URL required");
    const { DatabaseSync } = await import("node:sqlite");
    mkdirSync(".kareghar", { recursive: true });
    const sqlite = new DatabaseSync(".kareghar/market.db");
    initializeLocalDb(sqlite);
    database = {
      async query<T>(sql: string, values: Value[] = []) {
        const ordered: Value[] = [];
        const statement = sql.replace(/\$(\d+)/g, (_, n) => {
          ordered.push(values[Number(n) - 1]);
          return "?";
        });
        return sqlite
          .prepare(statement)
          .all(...ordered)
          .map((row) => ({ ...row })) as T[];
      },
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
