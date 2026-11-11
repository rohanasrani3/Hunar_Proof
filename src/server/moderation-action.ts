"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./moderation";
import { query } from "./db";
import { paragraph } from "@/contract/schemas";

export async function moderateAccount(_: string, data: FormData) {
  const actor = await requireAdmin(),
    reason = paragraph.safeParse(data.get("reason"));
  const target = String(data.get("target")),
    action = data.get("action");
  if (
    !/^\d+$/.test(String(data.get("version"))) ||
    !reason.success ||
    data.get("confirm") !== "on" ||
    !["suspend", "restore"].includes(String(action))
  )
    return "invalid";
  const suspend = action === "suspend" ? 1 : 0;
  // Conflicting concurrent decisions compete for the same sequence. A losing
  // write returns a conflict and must be reviewed against current state.
  const changed = await query(
    `INSERT INTO moderation_events(sequence,target,actor,suspended,reason,created)
    SELECT (SELECT COALESCE(MAX(sequence),0)+1 FROM moderation_events),t.id,a.id,$1,$2,$3
    FROM account_state a JOIN account_state t ON t.id=$4
    WHERE a.id=$5 AND a.effective_role='admin' AND a.suspended=0 AND a.session_version=$6
      AND t.session_version=$7 AND t.id<>a.id AND t.sample=0 AND t.suspended<>$1
    ON CONFLICT DO NOTHING RETURNING sequence`,
    [
      suspend,
      reason.data,
      Date.now(),
      target,
      actor.id,
      actor.session_version,
      Number(data.get("version")),
    ],
  );
  if (!changed.length) return "conflict";
  revalidatePath("/", "layout");
  return "saved";
}
