import Link from "next/link";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import { getServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

const ILO_URL = "https://oldwebsite.ihdindia.org/pdf/India-Employment-web-22-April.pdf";

const STEPS = [
  {
    n: "1",
    title: "An NGO describes a small task",
    body: "In its own words, in Hindi or English. The FirstShip agent turns it into acceptance criteria and milestones the NGO approves.",
  },
  {
    n: "2",
    title: "A learner ships it with a mentor",
    body: "We match a beginner coder and an experienced mentor. Every change gets a preview the NGO can try before anything goes live.",
  },
  {
    n: "3",
    title: "The work becomes proof",
    body: "The mentor checks each criterion, the NGO accepts, and the learner gets a public, verified work sample employers can inspect.",
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
          <h1 className="m-0 max-w-[820px] animate-rise font-serif text-[44px] leading-[1.04] font-semibold tracking-[-0.02em] text-balance sm:text-[68px]">
            Your first project, shipped for real.
          </h1>
          <p className="m-0 mt-6 max-w-[620px] text-lg leading-relaxed text-ink-2">
            Small NGOs need technical help. Beginner coders need real experience. FirstShip turns one into the other,
            with a mentor checking every step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/org/tasks/new" className="rounded-full bg-indigo px-6 py-3.5 font-medium text-white hover:bg-indigo-deep">
              Post a task for your NGO
            </Link>
            {sampleSlug && (
              <Link href={`/w/${sampleSlug}`} className="rounded-full border border-line-strong px-6 py-3.5 font-medium text-ink hover:bg-sunk">
                See a verified work sample
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="problem-h" className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:grid-cols-[1fr_1fr_1.2fr] sm:px-8">
            <h2 id="problem-h" className="sr-only">The problem</h2>
            <Stat value="83%" label="of India’s unemployed are young people" />
            <Stat value="29.1%" label="of graduates are unemployed, against 3.4% of people who cannot read or write" />
            <p className="m-0 self-center font-serif text-xl leading-snug italic text-quote">
              “No experience, no job. No job, no experience.” FirstShip breaks that loop with work that is real, reviewed and
              accepted.
              <a href={ILO_URL} target="_blank" rel="noreferrer" className="mt-3 block font-sans text-[13px] not-italic text-muted underline">
                Source: ILO &amp; IHD, India Employment Report 2024
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
              <Counter value={impact.tasksShipped} label="tasks shipped" />
              <Counter value={impact.learnersVerified} label="learners with verified work" />
              <Counter value={impact.orgHoursSaved} label="hours of work delivered" />
              <Counter value={impact.orgsServed} label="organisations served" />
            </dl>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-[1120px] px-4 py-10 text-[14px] text-muted sm:px-8">
        Open source (MIT). Built for Code for a Billion 2026, Track 10: Tech Employment for Youth.
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

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="m-0 font-serif text-[48px] leading-none font-semibold">{value}</dd>
      <dt className="mt-2 text-[15px] text-[#d9d4c7]">{label}</dt>
    </div>
  );
}
