import "server-only";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { initializeLocalDb } from "../../scripts/init-local-db.mjs";
import { ART_FORMS } from "@/contract/artForms";

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
  if (!process.env.DATABASE_URL || process.env.KAREGHAR_SEED_SAMPLES === "1") {
    for (const [id, name, role] of [
      ["demo-artist", "Meera Patil", "artist"],
      ["demo-blockprinter", "Meena K.", "artist"],
      ["demo-musician", "Ravi P.", "artist"],
      ["demo-customer", "Aangan Studio", "customer"],
    ]) {
      await database.query(
        "INSERT INTO accounts(id,username,email,name,role,password_hash,sample) VALUES($1,$1,$2,$3,$4,'',1) ON CONFLICT DO NOTHING",
        [id, id + "@example.invalid", name, role],
      );
    }
    await database.query(
      "INSERT INTO works VALUES ('demo-wall','demo-artist','warli','Village celebration','/seed/warli-final.svg') ON CONFLICT DO NOTHING",
    );
    await database.query(
      "INSERT INTO works VALUES ('demo-textile','demo-blockprinter','block-print','Floral block print','/seed/blockprint-sample.svg'),('demo-song','demo-musician','marathi-folk','Marathi folk jingle','/seed/jingle-draft.wav') ON CONFLICT DO NOTHING",
    );
    await database.query(
      "INSERT INTO commissions(id,customer,form,title,brief,fee,sample,created,status,artist) VALUES ('demo-mural','demo-customer','warli','Warli mural for a café','Paint a village celebration for the café counter wall.',8000,1,0,'done','demo-artist'),('demo-jingle','demo-customer','marathi-folk','Marathi folk jingle','Record a short folk melody for a café opening.',3000,1,0,'progress','demo-musician') ON CONFLICT DO NOTHING",
    );
    await database.query(
      "INSERT INTO commissions(id,customer,form,title,brief,fee,sample,created) VALUES ('demo-print','demo-customer','block-print','Hand-printed table runners','Design six cotton runners with Bagru floral motifs for our café.',4500,1,0) ON CONFLICT DO NOTHING",
    );
  }
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
