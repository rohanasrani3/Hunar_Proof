import { headers } from "next/headers";
import { createApi, LIVE_BASE, MODE } from "./api";

/**
 * Typed API client for Server Components and server routes.
 * Mock mode: calls this same deployment, using the host of the incoming request
 * (works on localhost, any port, and Vercel previews without extra env vars).
 * Live mode: calls Teammate A's backend.
 */
export async function getServerApi() {
  if (MODE === "live") return createApi(LIVE_BASE);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return createApi(`${proto}://${host}`);
}
