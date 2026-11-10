import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { BadRequest, BadState, NotFound } from "./mockStore";

/** Wraps a route handler: maps contract/store errors to the standard ApiError body. */
export async function handle(fn: () => unknown | Promise<unknown>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: "Invalid input", details: e.issues }, { status: 400 });
    if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 });
    if (e instanceof NotFound) return NextResponse.json({ error: e.message }, { status: 404 });
    if (e instanceof BadState) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  return schema.parse(await req.json());
}
