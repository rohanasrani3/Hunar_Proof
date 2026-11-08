import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";
import {
  CodeEvidence,
  CriteriaReview,
  Eyebrow,
  MentorRubric,
  MetaItem,
  PersonChip,
  VerifiedPill,
} from "@/components/proof/proof-parts";
import { ApiRequestError } from "@/lib/api";
import { getServerApi } from "@/lib/server-api";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** cache() de-dupes the fetch between generateMetadata and the page render. */
const load = cache(async (slug: string) => {
  try {
    return await (await getServerApi()).work.get(slug);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = await load(slug);
  const passed = w.review.results.filter((r) => r.verdict === "pass").length;
  return {
    title: `${w.task.title} — by ${w.learner.name}`,
    description: `Verified work sample: ${passed}/${w.task.criteria.length} acceptance criteria passed, reviewed by ${w.mentor.name}, accepted by ${w.org.name}.`,
  };
}

export default async function WorkSamplePage({ params }: Props) {
  const { slug } = await params;
  const w = await load(slug);
  const sub = w.submissions.find((s) => s.merged) ?? w.submissions.at(-1);
  const passed = w.review.results.filter((r) => r.verdict === "pass").length;
  const total = w.task.criteria.length;

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-4 pt-10 pb-12 sm:px-8 sm:pt-14">
        <Eyebrow>Verified work sample · {w.slug.toUpperCase()}</Eyebrow>
        <h1 className="m-0 mt-4 max-w-[860px] animate-rise font-serif text-[36px] leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-[54px] sm:leading-[1.06]">
          {w.task.title}
        </h1>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
          <PersonChip name={w.learner.name} subtitle={w.learner.college ? `Learner · ${w.learner.college}` : "Learner"} />
          <Divider />
          <MetaItem label="Mentored by" value={w.mentor.name} />
          <Divider />
          <MetaItem label="Shipped for" value={w.org.name} />
          <Divider />
          <MetaItem label="Shipped" value={formatDate(w.acceptance.acceptedAt)} />
        </div>

        <VerifiedPill passed={passed} total={total} />

        <div className="mt-12 flex flex-wrap items-start gap-12">
          <section className="min-w-0 flex-[999_1_560px]" aria-labelledby="criteria-h">
            <h2 id="criteria-h" className="m-0 mb-2 font-serif text-[26px] font-semibold">Acceptance criteria</h2>
            <p className="m-0 mb-5 text-[15px] text-muted">
              Agreed with {w.org.name} before work began. Each one was checked by the mentor.
            </p>
            <CriteriaReview criteria={w.task.criteria} review={w.review} />

            <details className="mt-6 text-[15px] text-ink-2">
              <summary className="cursor-pointer font-medium text-ink">What the NGO originally asked for</summary>
              <blockquote className="m-0 mt-3 rounded-xl bg-sunk px-4 py-3.5 font-serif text-base italic">
                “{w.task.rawRequest}”
              </blockquote>
            </details>
          </section>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <CodeEvidence sub={sub} skills={w.task.skills} repoUrl={w.task.repoUrl} liveUrl={w.liveUrl} />
            <MentorRubric review={w.review} />
          </aside>
        </div>

        <footer className="mt-10 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t-2 border-ink pt-6">
          <p className="m-0 text-[15px]">
            <b>
              Accepted by {w.acceptance.signatoryName}, {w.org.name}
            </b>{" "}
            <span className="text-muted">· {formatDate(w.acceptance.acceptedAt)}</span>
            {w.acceptance.quote && (
              <>
                {" — "}
                <span className="font-serif text-[17px] italic">“{w.acceptance.quote}”</span>
              </>
            )}
          </p>
          {w.learner.githubLogin && (
            <Link href={`/u/${w.learner.githubLogin}`} className="text-[15px] font-medium text-indigo hover:text-indigo-deep">
              See all of {w.learner.name.split(" ")[0]}’s work →
            </Link>
          )}
        </footer>
      </main>
    </>
  );
}

function Divider() {
  return <span aria-hidden="true" className="hidden h-8 w-px bg-line sm:block" />;
}
