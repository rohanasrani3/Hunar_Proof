/* eslint-disable @next/next/no-img-element -- covers may be SVG placeholders or uploads on another host */
import type { Metadata } from "next";
import Link from "next/link";
import { ART_FORMS, artForm, CATEGORIES, type Category } from "@/contract/artForms";
import type { TalentCard } from "@/contract/schemas";
import { DemoBanner } from "@/components/demo-banner";
import { CheckCircle, MapPin } from "@/components/icons";
import { SiteHeader } from "@/components/site-header";
import { getServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Find artists",
  description: "Browse folk painters, musicians, performers and craftspeople whose work has been checked by a guru and accepted by an employer.",
};

type Props = { searchParams: Promise<{ category?: string; artForm?: string }> };

const isCategory = (c?: string): c is Category => !!c && c in CATEGORIES;

export default async function TalentPage({ searchParams }: Props) {
  const sp = await searchParams;
  const selectedForm = sp.artForm && artForm(sp.artForm) ? sp.artForm : undefined;
  const category: Category | undefined = selectedForm ? artForm(selectedForm)!.category : isCategory(sp.category) ? sp.category : undefined;

  const api = await getServerApi();
  const all = await api.talent.list(selectedForm);
  const cards = category && !selectedForm ? all.filter((c) => c.person.artFormIds.some((id) => artForm(id)?.category === category)) : all;
  const formsInCategory = category ? ART_FORMS.filter((f) => f.category === category) : [];
  const filterLabel = selectedForm ? artForm(selectedForm)!.name : category ? CATEGORIES[category].en : null;

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-[1120px] px-4 pt-10 pb-16 sm:px-8 sm:pt-14">
        <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Find artists</p>
        <h1 className="m-0 mt-3 max-w-[760px] font-serif text-[36px] leading-[1.08] font-semibold tracking-[-0.02em] text-balance sm:text-[50px]">
          Artists with work you can check
        </h1>
        <p className="m-0 mt-4 max-w-[640px] text-[17px] leading-relaxed text-ink-2">
          Everyone here has finished at least one paid commission. A guru of the same art form reviewed it and the employer
          accepted it. Open any piece to see the photos, recordings and the guru’s notes.
        </p>

        <nav aria-label="Filter by art form" className="mt-8 flex flex-col gap-3">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            <FilterChip href="/talent" active={!category}>All</FilterChip>
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <FilterChip key={c} href={`/talent?category=${c}`} active={category === c && !selectedForm}>
                {CATEGORIES[c].en}
              </FilterChip>
            ))}
          </ul>
          {category && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`${CATEGORIES[category].en} forms`}>
              {formsInCategory.map((f) => (
                <FilterChip key={f.id} small href={`/talent?artForm=${f.id}`} active={selectedForm === f.id}>
                  {f.name}
                </FilterChip>
              ))}
            </ul>
          )}
        </nav>

        <p className="m-0 mt-8 text-[15px] text-muted" aria-live="polite">
          {cards.length === 1 ? "1 verified artist" : `${cards.length} verified artists`}
          {filterLabel ? ` in ${filterLabel}` : ""}
        </p>

        {cards.length > 0 ? (
          <ul className="m-0 mt-4 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c, i) => (
              <ArtistCard key={c.person.id} card={c} index={i} />
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-[14px] border border-dashed border-line-strong bg-card px-6 py-12 text-center">
            <h2 className="m-0 font-serif text-2xl font-semibold">No verified {filterLabel ?? ""} artists yet</h2>
            <p className="m-0 mx-auto mt-3 max-w-[460px] text-ink-2">
              Commission a piece and we’ll match you with an artist and a guru. Your commission becomes their first verified
              work.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/employer/commissions/new" className="rounded-full bg-indigo px-5 py-3 font-medium text-white hover:bg-indigo-deep">
                Commission work
              </Link>
              <Link href="/talent" className="rounded-full border border-line-strong px-5 py-3 font-medium text-ink hover:bg-sunk">
                See all artists
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function FilterChip({ href, active, small, children }: { href: string; active: boolean; small?: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`inline-flex items-center rounded-full border transition-colors ${small ? "min-h-9 px-3 text-[14px]" : "min-h-11 px-4 text-[15px] font-medium"} ${
          active ? "border-ink bg-ink text-paper" : "border-line-strong text-ink hover:bg-sunk"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

function ArtistCard({ card, index }: { card: TalentCard; index: number }) {
  const p = card.person;
  const forms = p.artFormIds.map((id) => artForm(id)?.name ?? id);
  const place = [p.city, p.region].filter(Boolean).join(", ");
  return (
    <li className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
      <article className="flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-card">
        <Link href={`/w/${card.topSampleSlug}`} className="block bg-sunk" tabIndex={-1} aria-hidden="true">
          {card.coverUrl ? (
            <img src={card.coverUrl} alt="" loading="lazy" className="block aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center font-serif text-xl text-muted italic">{forms[0]}</div>
          )}
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <h2 className="m-0 font-serif text-[22px] font-semibold">{p.name}</h2>
            <p className="m-0 mt-1 text-[15px] text-ink-2">{forms.join(" · ")}</p>
          </div>
          <dl className="m-0 flex flex-col gap-1.5 text-[14px] text-muted">
            {place && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Based in</dt>
                <MapPin className="flex-none" />
                <dd className="m-0">{place}</dd>
              </div>
            )}
            {p.yearsPracticing !== undefined && (
              <div>
                <dt className="sr-only">Experience</dt>
                <dd className="m-0">{p.yearsPracticing} years of practice · speaks {p.languages.join(", ")}</dd>
              </div>
            )}
          </dl>
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-[14px]">
            <span className="flex items-center gap-1.5 font-medium text-pass">
              <CheckCircle size={18} />
              {card.verifiedCount} verified {card.verifiedCount === 1 ? "work" : "works"}
            </span>
            <span className="text-muted">Guru score {card.avgScore.toFixed(1)}/5</span>
          </div>
          <Link href={`/w/${card.topSampleSlug}`} className="font-medium text-indigo hover:text-indigo-deep">
            See {p.name.split(" ")[0]}’s work →
          </Link>
        </div>
      </article>
    </li>
  );
}
