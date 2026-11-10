import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { artForm, artFormName } from "@/contract/artForms";
import { DemoBanner } from "@/components/demo-banner";
import { MapPin } from "@/components/icons";
import {
  CriteriaReview,
  Eyebrow,
  GuruAssessment,
  MediaView,
  MetaItem,
  PersonChip,
  ProcessTimeline,
  VerifiedPill,
} from "@/components/proof/proof-parts";
import { SiteHeader } from "@/components/site-header";
import { ApiRequestError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getServerApi } from "@/lib/server-api";

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
    title: `${w.commission.title} — by ${w.artist.name}`,
    description: `Verified ${w.commission.artFormIds.map((id) => artFormName(id)).join(", ")} work: ${passed}/${w.commission.criteria.length} criteria met, reviewed by ${w.guru.name}, accepted by ${w.employer.name}.`,
  };
}

export default async function WorkSamplePage({ params }: Props) {
  const { slug } = await params;
  const w = await load(slug);
  const allMedia = w.submissions.flatMap((s) => s.media);
  const finals = allMedia.filter((m) => m.stage === "final");
  const hero = finals.length ? finals : allMedia.slice(-1);
  const process = allMedia.filter((m) => !hero.includes(m));
  const passed = w.review.results.filter((r) => r.verdict === "pass").length;
  const forms = w.commission.artFormIds.map((id) => artForm(id)).filter((f) => !!f);
  const formLabel = forms.map((f) => f.name).join(", ");
  const artistPlace = [w.artist.city, w.artist.region].filter(Boolean).join(", ");

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-4 pt-10 pb-12 sm:px-8 sm:pt-14">
        <Eyebrow>
          Verified work · {formLabel} · {w.slug.toUpperCase()}
        </Eyebrow>
        <h1 className="m-0 mt-4 max-w-[860px] animate-rise font-serif text-[36px] leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-[54px] sm:leading-[1.06]">
          {w.commission.title}
        </h1>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
          <PersonChip name={w.artist.name} subtitle={`${formLabel} artist${artistPlace ? ` · ${artistPlace}` : ""}`} />
          <Divider />
          <MetaItem
            label="Reviewed by"
            value={w.guru.name}
            sub={w.guru.yearsPracticing ? `${w.guru.yearsPracticing} years of practice` : undefined}
          />
          <Divider />
          <MetaItem label="Commissioned by" value={w.employer.name} sub={`${w.employer.kind}, ${w.employer.city}`} />
          <Divider />
          <MetaItem label="Completed" value={formatDate(w.acceptance.acceptedAt)} sub="Paid commission" />
        </div>

        <VerifiedPill passed={passed} total={w.commission.criteria.length} />

        <section aria-label="The finished work" className="mt-10 flex flex-col gap-4">
          {hero.map((m, i) => (
            <figure key={m.id} className="m-0 animate-rise">
              <MediaView m={m} priority={i === 0} />
              {m.caption && m.kind !== "audio" && (
                <figcaption className="mt-2 text-[14px] text-muted">{m.caption}</figcaption>
              )}
            </figure>
          ))}
        </section>

        <div className="mt-12 flex flex-wrap items-start gap-12">
          <section className="min-w-0 flex-[999_1_560px]" aria-labelledby="criteria-h">
            <h2 id="criteria-h" className="m-0 mb-2 font-serif text-[26px] font-semibold">What was asked for</h2>
            <p className="m-0 mb-5 text-[15px] text-muted">
              Agreed with {w.employer.name} before work began. The guru checked each one.
            </p>
            <CriteriaReview criteria={w.commission.criteria} review={w.review} />

            <details className="mt-6 text-[15px] text-ink-2">
              <summary className="cursor-pointer font-medium text-ink">The employer’s original request</summary>
              <blockquote className="m-0 mt-3 rounded-xl bg-sunk px-4 py-3.5 font-serif text-base italic">
                “{w.commission.rawRequest}”
              </blockquote>
              {w.commission.onSite && w.commission.city && (
                <p className="m-0 mt-3 flex items-center gap-1.5 text-[14px] text-muted">
                  <MapPin /> Made on site in {w.commission.city}
                </p>
              )}
            </details>
          </section>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <ProcessTimeline media={process} />
            <GuruAssessment review={w.review} guruName={w.guru.name} />
          </aside>
        </div>

        <footer className="mt-10 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4 border-t-2 border-ink pt-6">
          <p className="m-0 text-[15px]">
            <b>
              Accepted by {w.acceptance.signatoryName}, {w.employer.name}
            </b>{" "}
            <span className="text-muted">· {formatDate(w.acceptance.acceptedAt)}</span>
            {w.acceptance.quote && (
              <>
                {" — "}
                <span className="font-serif text-[17px] italic">“{w.acceptance.quote}”</span>
              </>
            )}
          </p>
          {w.artist.handle && (
            <Link href={`/u/${w.artist.handle}`} className="text-[15px] font-medium text-indigo hover:text-indigo-deep">
              See all of {w.artist.name.split(" ")[0]}’s work →
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
