/** Shown while running on seed data so nobody mistakes it for real pilot impact. */
export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_API_MODE === "live") return null;
  return (
    <div className="bg-sunk px-4 py-2 text-center text-[13px] text-ink-2">
      Demo data. Names in [brackets] are placeholders until the pilot NGO is confirmed.
    </div>
  );
}
