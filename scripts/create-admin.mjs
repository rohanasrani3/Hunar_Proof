import { initializeLocalDb } from "./init-local-db.mjs";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { hash } from "@node-rs/argon2";
import postgres from "postgres";
import { z } from "zod";

const username = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,40}$/)
  .parse(process.argv[2]);
const email = process.argv[3]
  ? z.email().parse(process.argv[3]).toLowerCase()
  : "";
const password = randomBytes(24).toString("base64url");
const values = [
  randomUUID(),
  username,
  email,
  process.argv[2],
  await hash(password),
];
const insert =
  "INSERT INTO accounts(id,username,email,name,role,password_hash) VALUES($1,$2,$3,$4,'customer',$5)";
if (process.env.DATABASE_URL) {
  const db = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    await db.begin(async (tx) => {
      await tx.unsafe(insert, values);
      await tx.unsafe("INSERT INTO admin_grants VALUES($1)", [values[0]]);
    });
  } finally {
    await db.end();
  }
} else {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.KAREGHAR_LOCAL !== "1"
  )
    throw Error("DATABASE_URL required");
  const { DatabaseSync } = await import("node:sqlite");
  mkdirSync(".kareghar", { recursive: true });
  const db = new DatabaseSync(".kareghar/market.db");
  try {
    initializeLocalDb(db);
    db.exec("BEGIN IMMEDIATE");
    db.prepare(insert.replace(/\$\d/g, "?")).run(...values);
    db.prepare("INSERT INTO admin_grants VALUES(?)").run(values[0]);
    db.exec("COMMIT");
  } finally {
    db.close();
  }
}
process.stdout.write(password + "\n");
