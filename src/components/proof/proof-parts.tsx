/* eslint-disable @next/next/no-img-element -- media may be SVG placeholders or user uploads on another host */
import type { Criterion, Media, Review } from "@/contract/schemas";
import { AlertCircle, CheckCircle, CheckCircleDraw, Speaker } from "@/components/icons";
import { formatDate, initials } from "@/lib/format";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</p>;
}

export function VerifiedPill({ passed, total }: { passed: number; total: number }) {
  const all = passed === total;
  return (
    <div
      className={`mt-7 inline-flex animate-stamp items-center gap-2.5 rounded-full py-2.5 pr-[18px] pl-3 text-[15px] font-medium ${
        all ? "bg-indigo text-white" : "bg-sunk text-ink"
      }`}
    >
      {all ? <CheckCircleDraw size={22} /> : <AlertCircle size={22} />}
      {all ? "Verified" : "Accepted"} · {passed} of {total} criteria met
    </div>
  );
}

export function MetaItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-[15px] leading-snug">
      <div className="text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
      {sub && <div className="text-[13px] text-muted">{sub}</div>}
    </div>
  );
}

export function PersonChip({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-[#e3dccb] font-semibold text-indigo">
        {initials(name)}
      </div>
      <div className="text-[15px] leading-snug">
        <div className="font-semibold">{name}</div>
        {subtitle && <div className="text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

/** One piece of media at full size: photo, audio or video. */
export function MediaView({ m, priority }: { m: Media; priority?: boolean }) {
  if (m.kind === "photo") {
    return (
      <img
        src={m.url}
        alt={m.caption ?? "Photo of the work"}
        loading={priority ? "eager" : "lazy"}
        className="block h-auto w-full rounded-[14px] border border-line bg-sunk"
      />
    );
  }
  if (m.kind === "video") {
    return (
      <video controls preload="metadata" playsInline className="block w-full rounded-[14px] border border-line bg-ink">
        <source src={m.url} />
        Your browser can’t play this video. <a href={m.url}>Download it</a>.
      </video>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-card p-5">
      <div className="flex items-center gap-2 text-[15px] font-medium">
        <Speaker className="text-saffron" /> {m.caption ?? "Recording"}
        {m.durationSec && <span className="font-normal text-muted">· {Math.round(m.durationSec)} s</span>}
      </div>
      <audio controls preload="metadata" src={m.url} className="w-full">
        <a href={m.url}>Download the recording</a>
      </audio>
    </div>
  );
}

export function CriteriaReview({ criteria, review }: { criteria: Criterion[]; review: Review }) {
  const byId = new Map(review.results.map((r) => [r.criterionId, r]));
  return (
    <ol className="m-0 list-none border-t border-line p-0">
      {criteria.map((c, i) => {
        const r = byId.get(c.id);
        const pass = r?.verdict === "pass";
        return (
          <li key={c.id} className="flex animate-rise gap-4 border-b border-line py-[18px]" style={{ animationDelay: `${120 + i * 60}ms` }}>
            {pass ? <CheckCircle className="mt-0.5 flex-none text-pass" /> : <AlertCircle className="mt-0.5 flex-none text-fail" />}
            <div>
              <span className="sr-only">{pass ? "Met: " : "Needs work: "}</span>
              <div className="text-[17px] leading-[1.45] font-medium">{c.text}</div>
              {r?.comment && <div className="mt-1.5 font-serif text-base text-quote italic">“{r.comment}”</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-card p-6">
      <h2 className="m-0 mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** Work-in-progress media in time order: the proof that the artist really made it. */
export function ProcessTimeline({ media }: { media: Media[] }) {
  if (!media.length) return null;
  return (
    <Card title="How it was made">
      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {media.map((m) => (
          <li key={m.id} className="flex gap-3.5">
            {m.kind === "photo" ? (
              <a href={m.url} target="_blank" rel="noreferrer" className="flex-none">
                <img src={m.url} alt={m.caption ?? "Work in progress"} loading="lazy" className="size-20 rounded-lg border border-line object-cover" />
              </a>
            ) : (
              <span aria-hidden="true" className="flex size-20 flex-none items-center justify-center rounded-lg bg-sunk text-saffron">
                <Speaker size={26} />
              </span>
            )}
            <div className="min-w-0 text-[15px] leading-snug">
              <div className="font-medium">{m.caption ?? (m.stage === "final" ? "Finished work" : "Work in progress")}</div>
              <div className="mt-0.5 text-[13px] text-muted">
                {m.stage === "final" ? "Final" : "In progress"} · {formatDate(m.createdAt)}
              </div>
              {m.kind !== "photo" && (
                <audio controls preload="none" src={m.url} className="mt-2 h-9 w-full">
                  <a href={m.url}>Download</a>
                </audio>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const RUBRIC: { key: keyof Review["rubric"]; label: string }[] = [
  { key: "craft", label: "Craft and finish" },
  { key: "tradition", label: "True to the tradition" },
  { key: "timeliness", label: "On time" },
];

export function GuruAssessment({ review, guruName }: { review: Review; guruName: string }) {
  return (
    <Card title="Guru’s assessment">
      <dl className="m-0 flex flex-col gap-3.5 text-[15px]">
        {RUBRIC.map(({ key, label }) => {
          const v = review.rubric[key];
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <dt>{label}</dt>
              <dd className="m-0 flex items-center gap-1" aria-label={`${v} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} aria-hidden="true" className={`h-1.5 w-[18px] rounded-[3px] ${n <= v ? "bg-indigo" : "bg-line"}`} />
                ))}
                <b className="ml-2" aria-hidden="true">{v}/5</b>
              </dd>
            </div>
          );
        })}
      </dl>
      {review.summary && (
        <p className="m-0 mt-[18px] font-serif text-base leading-normal text-quote italic">
          “{review.summary}” <span className="font-sans text-[13px] not-italic text-muted">— {guruName}</span>
        </p>
      )}
      {review.voiceNoteUrl && (
        <audio controls preload="none" src={review.voiceNoteUrl} className="mt-3 h-9 w-full" aria-label="Guru’s voice note" />
      )}
    </Card>
  );
}
