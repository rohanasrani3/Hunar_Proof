import Link from "next/link";
import { CATEGORIES } from "@/contract/artForms";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { formatInr } from "@/lib/format";
import { getServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

// CCI–IHD, "Economics of Indian Craft" (2026), as reported by Garland Magazine.
const SOURCE_URL = "https://garlandmag.com/article/high-cultural-value-low-artisan-income/";

const STEPS = [
  {
    n: "1",
    title: "An employer describes what they need",
    body: "A café wants a Warli mural, a hotel wants a folk band, a brand wants block-printed gifts. The Hunar Proof agent turns it into a clear brief with a fair fee.",
  },
  {
    n: "2",
    title: "An artist makes it, a guru guides it",
    body: "We match a skilled artist with a guru, a master of the same art form. The artist shares photos, recordings and videos from the phone as the work takes shape.",
  },
  {
    n: "3",
    title: "The work becomes proof",
    body: "The guru checks each point of the brief, the employer accepts, and the artist gets a public, verified record that the next employer can trust.",
  },
];

export default async function Home() {
  const api = await getServerApi();
  const [impact, talent] = await Promise.all([api.impact.get(), api.talent.list()]);
  const sampleSlug = talent[0]?.topSampleSlug;

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1120px] px-4 pt-14 pb-16 sm:px-8 sm:pt-20">
          <h1 className="m-0 max-w-[880px] animate-rise font-serif text-[44px] leading-[1.04] font-semibold tracking-[-0.02em] text-balance sm:text-[68px]">
            Skill you can see. Work employers can trust.
          </h1>
          <p className="m-0 mt-6 max-w-[640px] text-lg leading-relaxed text-ink-2">
            India’s folk painters, musicians, dancers and craftspeople are judged by certificates they never had a chance
            to earn. Hunar Proof lets them prove their skill on real, paid work, checked by a guru and accepted by the
            employer.
          </p>
          <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0 text-[14px]">
            {Object.values(CATEGORIES).map((c) => (
              <li key={c.en} className="rounded-full bg-sunk px-3 py-1.5 text-ink-2">{c.en}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/employer/commissions/new" className="rounded-full bg-indigo px-6 py-3.5 font-medium text-white hover:bg-indigo-deep">
              Commission an artist
            </Link>
            {sampleSlug && (
              <Link href={`/w/${sampleSlug}`} className="rounded-full border border-line-strong px-6 py-3.5 font-medium text-ink hover:bg-sunk">
                See verified work
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="problem-h" className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:grid-cols-[1fr_1fr_1.2fr] sm:px-8">
            <h2 id="problem-h" className="sr-only">The problem</h2>
            <Stat value="₹7,000" label="average monthly earnings of handloom and handicraft workers" />
            <Stat value="61 lakh" label="people work in handloom and handicraft in just five surveyed states" />
            <p className="m-0 self-center font-serif text-xl leading-snug italic text-quote">
              Talent isn’t the problem. Proof is. An employer can’t ask a Warli painter for a degree, so they hire nobody,
              or pay the least they can.
              <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="mt-3 block font-sans text-[13px] not-italic text-muted underline">
                Source: Crafts Council of India &amp; IHD, Economics of Indian Craft (2026)
              </a>
            </p>
          </div>
        </section>

        <section aria-labelledby="how-h" className="mx-auto max-w-[1120px] px-4 py-16 sm:px-8">
          <h2 id="how-h" className="m-0 font-serif text-[32px] font-semibold">How it works</h2>
          <ol className="m-0 mt-8 grid list-none gap-8 p-0 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t-2 border-ink pt-5">
                <span className="font-serif text-[15px] font-semibold text-saffron">Step {s.n}</span>
                <h3 className="m-0 mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="m-0 mt-2 leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="impact-h" className="bg-ink text-paper">
          <div className="mx-auto max-w-[1120px] px-4 py-14 sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="impact-h" className="m-0 font-serif text-[32px] font-semibold">The pilot so far</h2>
              <Link href="/impact" className="font-medium text-[#c9cdf0] hover:text-white">Full impact record →</Link>
            </div>
            <dl className="m-0 mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
              <Counter value={formatInr(impact.artistEarningsInr)} label="earned by artists" />
              <Counter value={impact.commissionsCompleted} label="commissions completed" />
              <Counter value={impact.artistsVerified} label="artists with verified work" />
              <Counter value={impact.employersServed} label="employers served" />
            </dl>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-[1120px] px-4 py-10 text-[14px] text-muted sm:px-8">
        Open source (MIT). Built for Code for a Billion 2026, Track 9: Livelihood for the Uneducated.
      </footer>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-[56px] leading-none font-semibold text-indigo">{value}</div>
      <p className="m-0 mt-3 text-[15px] leading-normal text-ink-2">{label}</p>
    </div>
  );
}

function Counter({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-2 text-[15px] text-[#d9d4c7]">{label}</dt>
      <dd className="m-0 font-serif text-[40px] leading-none font-semibold sm:text-[48px]">{value}</dd>
    </div>
  );
}
