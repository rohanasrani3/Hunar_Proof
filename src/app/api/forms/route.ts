import { forms } from "@/server/market";
export async function GET() {
  return Response.json(await forms());
}
