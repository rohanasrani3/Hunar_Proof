import { artists } from "@/server/market";
import { viewer } from "@/server/auth";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const user = await viewer();
  const people = await artists({
    form: params.get("form") ?? params.get("artFormId") ?? "",
    category: params.get("category") ?? "",
  });
  let previous = -1, rank = 0;
  return Response.json(
    people.map((person, i) => {
      const completed = Number(person.completed);
      if (completed !== previous) { rank = i + 1; previous = completed; }
      return { ...person, rank: completed ? rank : null };
    }).filter((person) => person.id !== user?.id),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
