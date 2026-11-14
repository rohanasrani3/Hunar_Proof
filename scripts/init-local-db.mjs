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
    if (!db.prepare("PRAGMA table_info(accounts)").all().some((column) => column.name === "bio"))
      db.exec(
        readFileSync("migrations/004_experience.sql", "utf8")
          .split("-- PostgreSQL privileges")[0]
          .replace("BEGIN;", ""),
      );
    if (!db.prepare("PRAGMA table_info(commissions)").all().some((column) => column.name === "deadline"))
      db.exec(readFileSync("migrations/005_deadline.sql", "utf8").split("-- PostgreSQL privileges")[0].replace("BEGIN;", ""));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
