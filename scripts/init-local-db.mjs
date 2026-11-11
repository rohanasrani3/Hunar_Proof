import { readFileSync } from "node:fs";
export function initializeLocalDb(db) {
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(readFileSync("migrations/001_marketplace.sql", "utf8"));
    if (
      !db.prepare("SELECT 1 FROM sqlite_master WHERE name='admin_grants'").get()
    )
      db.exec(
        readFileSync("migrations/003_moderation.sql", "utf8")
          .split("-- PostgreSQL privileges")[0]
          .replace("BEGIN;", ""),
      );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
