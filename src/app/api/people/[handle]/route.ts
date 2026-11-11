import { publicProfile } from "@/server/market";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const person = await publicProfile((await params).handle);
  return person ? Response.json(person) : new Response(null, { status: 404 });
}
