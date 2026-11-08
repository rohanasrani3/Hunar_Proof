import type { Criterion, Review, Submission } from "@/contract/schemas";
import { AlertCircle, ArrowUpRight, CheckCircle, CheckCircleDraw } from "@/components/icons";
import { initials } from "@/lib/format";

export function Eyebrow({ children, as: Tag = "p" }: { children: React.ReactNode; as?: "p" | "h2" }) {
  return (
    <Tag className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</Tag>
  );
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
      {all ? "Verified" : "Accepted"} · {passed} of {total} acceptance criteria passed
    </div>
  );
}

export function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[15px] leading-snug">
      <div className="text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export function PersonChip({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-[#e3dccb] font-semibold text-indigo"
      >
        {initials(name)}
      </div>
      <div className="text-[15px] leading-snug">
        <div className="font-semibold">{name}</div>
        {subtitle && <div className="text-muted">{subtitle}</div>}
      </div>
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
          <li
            key={c.id}
            className="flex animate-rise gap-4 border-b border-line py-[18px]"
            style={{ animationDelay: `${120 + i * 60}ms` }}
          >
            {pass ? (
              <CheckCircle className="mt-0.5 flex-none text-pass" />
            ) : (
              <AlertCircle className="mt-0.5 flex-none text-fail" />
            )}
            <div>
              <span className="sr-only">{pass ? "Passed: " : "Needs work: "}</span>
              <div className="text-[17px] leading-[1.45] font-medium">{c.text}</div>
              {r?.comment && (
                <div className="mt-1.5 font-serif text-base text-quote italic">“{r.comment}”</div>
              )}
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

export function CodeEvidence({ sub, skills, repoUrl, liveUrl }: { sub?: Submission; skills: string[]; repoUrl?: string; liveUrl?: string }) {
  if (!sub) return null;
  const prNumber = sub.prUrl.match(/\/pull\/(\d+)/)?.[1];
  const checks =
    sub.ciStatus === "pass" ? { t: "Passing", c: "text-pass" } : sub.ciStatus === "fail" ? { t: "Failing", c: "text-fail" } : { t: "Pending", c: "text-muted" };
  return (
    <Card title="Code evidence">
      <a href={sub.prUrl} target="_blank" rel="noreferrer" className="block text-lg font-semibold text-ink hover:text-indigo">
        Pull request {prNumber ? `#${prNumber}` : ""} · {sub.merged ? "merged" : "open"}
      </a>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5 text-[15px]">
        <div>
          <dt className="text-muted">Commits</dt>
          <dd className="m-0 mt-0.5 font-semibold">{sub.commits}</dd>
        </div>
        <div>
          <dt className="text-muted">Changes</dt>
          <dd className="m-0 mt-0.5 font-semibold">
            <span className="text-pass">+{sub.additions}</span> <span className="text-fail">−{sub.deletions}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Checks</dt>
          <dd className={`m-0 mt-0.5 font-semibold ${checks.c}`}>
            ● {checks.t}
            {sub.testsTotal ? <span className="font-normal text-muted"> · {sub.testsPassed}/{sub.testsTotal} tests</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Stack</dt>
          <dd className="m-0 mt-0.5 font-semibold">{skills.slice(0, 3).join(", ")}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-auto items-center justify-center gap-1.5 rounded-[10px] bg-indigo px-3.5 py-3 text-[15px] font-medium text-white hover:bg-indigo-deep"
          >
            Open live site <ArrowUpRight />
          </a>
        )}
        <a
          href={repoUrl ?? sub.prUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-auto rounded-[10px] border border-line-strong px-3.5 py-3 text-center text-[15px] font-medium text-ink hover:bg-sunk"
        >
          View code
        </a>
      </div>
    </Card>
  );
}

const RUBRIC: { key: keyof Review["rubric"]; label: string }[] = [
  { key: "codeQuality", label: "Code quality" },
  { key: "communication", label: "Communication" },
  { key: "timeliness", label: "Timeliness" },
];

export function MentorRubric({ review }: { review: Review }) {
  return (
    <Card title="Mentor rubric">
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
        <p className="m-0 mt-[18px] font-serif text-base leading-normal text-quote italic">“{review.summary}”</p>
      )}
    </Card>
  );
}
