import type { Metadata } from "next";
import Link from "next/link";
import type { ImpactStats } from "@/contract/schemas";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { formatDate, formatInr } from "@/lib/format";
import { getServerApi } from "@/lib/server-api";
import { MODE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Impact",
  description: "Live record of the Hunar Proof pilot: money earned by artists, commissions completed and artists with verified work.",
};

type Event = ImpactStats["events"][number];

const KIND: Record<Event["kind"], { label: string; dot: string }> = {
  commission_posted: { label: "Posted", dot: "bg-line-strong" },
  matched: { label: "Matched", dot: "bg-saffron" },
  submitted: { label: "Work shared", dot: "bg-saffron" },
  reviewed: { label: "Guru review", dot: "bg-indigo" },
  accepted: { label: "Accepted", dot: "bg-pass" },
  verified: { label: "Verified", dot: "bg-pass" },
};

const METHOD = [
  { term: "Earned by artists", def: "The sum of agreed fees for commissions the employer has accepted. Employers pay artists directly. Hunar Proof never takes a cut." },
  { term: "Commissions completed", def: "Commissions the employer accepted after viewing the finished work." },
  { term: "Artists with verified work", def: "Artists with at least one commission where the guru passed every point of the brief and the employer accepted it." },
  { term: "Employers served", def: "Businesses that have posted at least one commission." },
];

export default async function ImpactPage() {
  const s = await (await getServerApi()).impact.get();
  const completion = s.commissionsPosted ? Math.round((s.commissionsCompleted / s.commissionsPosted) * 100) : 0;
  const avgFee = s.commissionsCompleted ? Math.round(s.artistEarningsInr / s.commissionsCompleted) : 0;
  const days = groupByDay(s.events);

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1120px] px-4 pt-10 pb-12 sm:px-8 sm:pt-14">
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Impact</p>
          <h1 className="m-0 mt-3 max-w-[780px] font-serif text-[36px] leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-[50px]">
            What the pilot has done so far
          </h1>
          <p className="m-0 mt-4 max-w-[640px] text-[17px] leading-relaxed text-ink-2">
            {MODE === "live"
              ? "Every number on this page is counted from live records, updated each time someone loads it."
              : "These numbers come from demo seed data. Once the pilot runs on the live backend, this page counts real records only."}
          </p>
        </section>

        <section aria-labelledby="totals-h" className="bg-ink text-paper">
          <h2 id="totals-h" className="sr-only">Totals</h2>
          <dl className="mx-auto m-0 grid max-w-[1120px] grid-cols-2 gap-x-8 gap-y-10 px-4 py-12 sm:grid-cols-4 sm:px-8">
            <Big value={formatInr(s.artistEarningsInr)} label="earned by artists" />
            <Big value={s.commissionsCompleted} label="commissions completed" />
            <Big value={s.artistsVerified} label="artists with verified work" />
            <Big value={s.employersServed} label="employers served" />
          </dl>
        </section>

        <div className="mx-auto flex max-w-[1120px] flex-wrap items-start gap-12 px-4 py-14 sm:px-8">
          <section aria-labelledby="log-h" className="min-w-0 flex-[999_1_560px]">
            <h2 id="log-h" className="m-0 font-serif text-[28px] font-semibold">Activity log</h2>
            <p className="m-0 mt-2 text-[15px] text-muted">Newest first. Each line is a real step in a commission.</p>
            {days.length ? (
              <ol className="m-0 mt-6 flex list-none flex-col gap-8 p-0">
                {days.map(([day, events]) => (
                  <li key={day}>
                    <h3 className="m-0 border-b border-line pb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{day}</h3>
                    <ul className="m-0 list-none p-0">
                      {events.map((e, i) => (
                        <li key={`${e.at}-${i}`} className="flex items-start gap-3 border-b border-line py-3.5 text-[15px]">
                          <span aria-hidden="true" className={`mt-[7px] size-2.5 flex-none rounded-full ${KIND[e.kind].dot}`} />
                          <span className="w-24 flex-none text-[13px] font-semibold text-muted sm:w-28">{KIND[e.kind].label}</span>
                          <span className="min-w-0 flex-1">{e.label}</span>
                          <time dateTime={e.at} className="flex-none text-[13px] text-muted tabular-nums">
                            {timeOf(e.at)}
                          </time>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 mt-6 rounded-[14px] border border-dashed border-line-strong bg-card px-5 py-8 text-center text-ink-2">
                Nothing has happened yet. The first commission will appear here.
              </p>
            )}
          </section>

          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
            <section className="rounded-[14px] border border-line bg-card p-6">
              <h2 className="m-0 mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Pipeline</h2>
              <dl className="m-0 flex flex-col gap-3 text-[15px]">
                <Row term="Commissions posted" value={s.commissionsPosted} />
                <Row term="Completed" value={s.commissionsCompleted} />
                <Row term="Average fee per commission" value={avgFee ? formatInr(avgFee) : "–"} />
              </dl>
              <div className="mt-5">
                <div className="flex justify-between text-[13px] text-muted">
                  <span>Completion rate</span>
                  <span>{completion}%</span>
                </div>
                <div
                  className="mt-1.5 h-2 rounded-full bg-line"
                  role="progressbar"
                  aria-label="Completion rate"
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-2 rounded-full bg-indigo" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </section>

            <section className="rounded-[14px] border border-line bg-card p-6">
              <h2 className="m-0 mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">How we count</h2>
              <dl className="m-0 flex flex-col gap-4 text-[14px] leading-normal">
                {METHOD.map((m) => (
                  <div key={m.term}>
                    <dt className="font-semibold">{m.term}</dt>
                    <dd className="m-0 mt-1 text-ink-2">{m.def}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <Link href="/talent" className="rounded-full bg-indigo px-5 py-3 text-center font-medium text-white hover:bg-indigo-deep">
              Meet the artists
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}

function Big({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-2 text-[15px] text-[#d9d4c7]">{label}</dt>
      <dd className="m-0 font-serif text-[40px] leading-none font-semibold sm:text-[52px]">{value}</dd>
    </div>
  );
}

function Row({ term, value }: { term: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-2">{term}</dt>
      <dd className="m-0 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const timeOf = (iso: string) => timeFmt.format(new Date(iso));

/** Events arrive newest first; group them under IST calendar days, keeping order. */
function groupByDay(events: Event[]): [string, Event[]][] {
  const groups = new Map<string, Event[]>();
  for (const e of events) {
    const day = formatDate(e.at);
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }
  return [...groups];
}
