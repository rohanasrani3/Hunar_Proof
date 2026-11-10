"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { artFormName } from "@/contract/artForms";
import type { Criterion, DraftBriefEvent, Milestone } from "@/contract/schemas";
import { CheckCircleDraw, ChevronLeft, MapPin, Pencil, Sparkle, Trash } from "@/components/icons";
import { api, streamDraftBrief } from "@/lib/api";
import { DEMO_EMPLOYER_ID } from "@/lib/demo";
import { formatInr } from "@/lib/format";
import { employerStrings, type EmployerStrings, type Lang } from "@/i18n/employer";
import { useLang } from "@/i18n/use-lang";

type Item = Criterion & { streaming: boolean; editing: boolean };
type Step = 1 | 2 | 3;
type Meta = { artFormIds: string[]; estDays: number; suggestedFeeInr: number; onSite: boolean };

export function NewCommissionFlow() {
  const [lang, setLang] = useLang();
  const t = employerStrings[lang];

  const [step, setStep] = useState<Step>(1);
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [fee, setFee] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ n: number; days: number; fee: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const tooShort = raw.trim().length < 10;

  function onEvent(e: DraftBriefEvent) {
    switch (e.type) {
      case "title":
        setTitle(e.title);
        break;
      case "criterion_start":
        setItems((xs) => [...xs, { id: e.id, text: "", aiGenerated: true, approved: false, streaming: true, editing: false }]);
        break;
      case "criterion_delta":
        setItems((xs) => xs.map((x) => (x.id === e.id ? { ...x, text: x.text + e.text } : x)));
        break;
      case "criterion_end":
        setItems((xs) => xs.map((x) => (x.id === e.id ? { ...x, text: x.text.trim(), streaming: false } : x)));
        break;
      case "milestone":
        setMilestones((ms) => [...ms, e.milestone]);
        break;
      case "meta":
        setMeta({ artFormIds: e.artFormIds, estDays: e.estDays, suggestedFeeInr: e.suggestedFeeInr, onSite: e.onSite });
        setFee(String(e.suggestedFeeInr));
        break;
      case "error":
        setError(t.errorDraft);
        break;
    }
  }

  async function startDraft() {
    setTouched(true);
    if (tooShort) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStep(2);
    setItems([]);
    setMilestones([]);
    setMeta(null);
    setError(null);
    setDrafting(true);
    try {
      await streamDraftBrief(raw.trim(), onEvent, ctrl.signal);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError(t.errorDraft);
    } finally {
      if (abortRef.current === ctrl) setDrafting(false);
    }
  }

  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    setMilestones((ms) => ms.map((m) => ({ ...m, criterionIds: m.criterionIds.filter((c) => c !== id) })));
  };
  const add = () =>
    setItems((xs) => [...xs, { id: `u${Date.now()}`, text: "", aiGenerated: false, approved: true, streaming: false, editing: true }]);

  const finished = items.filter((x) => !x.streaming && x.text.trim());
  const approved = finished.filter((x) => x.approved);
  const feeInr = Math.max(0, Math.round(Number(fee) || 0));

  async function publish() {
    if (!approved.length) return;
    setPublishing(true);
    setError(null);
    try {
      const ids = new Set(approved.map((x) => x.id));
      const kept = milestones
        .map((m) => ({ ...m, criterionIds: m.criterionIds.filter((c) => ids.has(c)) }))
        .filter((m) => m.criterionIds.length);
      const estDays = kept.reduce((n, m) => n + m.estDays, 0) || meta?.estDays || 1;
      const c = await api.commissions.create({ employerId: DEMO_EMPLOYER_ID, rawRequest: raw.trim(), title: title || undefined });
      await api.commissions.update(c.id, {
        status: "open",
        artFormIds: meta?.artFormIds ?? [],
        onSite: meta?.onSite ?? false,
        estDays,
        feeInr,
        criteria: approved.map(({ id, text, aiGenerated }) => ({ id, text: text.trim(), aiGenerated, approved: true })),
        milestones: kept,
      });
      setPublished({ n: approved.length, days: estDays, fee: feeInr });
      setStep(3);
    } catch {
      setError(t.errorPublish);
    } finally {
      setPublishing(false);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setStep(1);
    setRaw("");
    setTouched(false);
    setItems([]);
    setMilestones([]);
    setMeta(null);
    setPublished(null);
    setError(null);
  }

  return (
    <div lang={lang} className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-paper sm:border-x sm:border-line">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper px-4 pt-3 pb-2.5">
        {step === 2 ? (
          <button type="button" onClick={() => setStep(1)} aria-label={t.back} className="flex size-11 items-center justify-center rounded-full hover:bg-sunk">
            <ChevronLeft />
          </button>
        ) : (
          <Link href="/" aria-label={t.back} className="flex size-11 items-center justify-center rounded-full hover:bg-sunk">
            <ChevronLeft />
          </Link>
        )}
        <span className="font-serif text-[19px] font-semibold">{t.newCommission}</span>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div className="flex flex-1 flex-col gap-[18px] px-4 pt-5 pb-6">
        <Progress step={step} />

        {step === 1 && (
          <>
            <div>
              <Eyebrow>{t.stepOf(1)}</Eyebrow>
              <h1 className="m-0 mt-1.5 font-serif text-[28px] leading-[1.15] font-semibold">{t.s1Title}</h1>
              <p className="m-0 mt-2 text-[15px] leading-normal text-ink-2">{t.s1Hint}</p>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">{t.s1Label}</span>
              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={7}
                placeholder={t.s1Placeholder}
                aria-invalid={touched && tooShort}
                aria-describedby={touched && tooShort ? "raw-err" : undefined}
                className="w-full resize-y rounded-xl border border-line-strong bg-card px-4 py-3 text-base leading-normal placeholder:text-muted/80 focus:border-indigo focus:outline-none"
              />
              {touched && tooShort && <span id="raw-err" className="text-[14px] text-fail">{t.s1TooShort}</span>}
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <Eyebrow>{t.stepOf(2)}</Eyebrow>
              <h1 className="m-0 mt-1.5 font-serif text-[28px] leading-[1.15] font-semibold">{t.s2Title}</h1>
            </div>

            <figure className="m-0 rounded-xl bg-sunk px-4 py-3.5">
              <figcaption className="mb-1.5 text-xs font-semibold text-muted">{t.youWrote}</figcaption>
              <blockquote className="m-0 font-serif text-base leading-[1.45] italic">“{raw.trim()}”</blockquote>
            </figure>

            <div className="flex min-h-11 items-center justify-between gap-3 text-[13px] text-ink-2">
              <span className="flex items-center gap-2" aria-live="polite">
                <Sparkle className="text-saffron" />
                {drafting ? t.agentWorking : t.agentNote}
              </span>
              {!drafting && finished.length > 0 && approved.length < finished.length && (
                <button
                  type="button"
                  onClick={() => setItems((xs) => xs.map((x) => ({ ...x, approved: true })))}
                  className="min-h-11 shrink-0 px-1 font-medium text-indigo"
                >
                  {t.approveAll}
                </button>
              )}
            </div>

            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {items.map((x, i) => (
                <CriterionRow
                  key={x.id}
                  item={x}
                  index={i + 1}
                  t={t}
                  onToggle={() => patch(x.id, { approved: !x.approved })}
                  onEdit={() => patch(x.id, { editing: true })}
                  onSave={(text) => (text.trim() ? patch(x.id, { text, editing: false, aiGenerated: false }) : remove(x.id))}
                  onRemove={() => remove(x.id)}
                />
              ))}
            </ul>

            {!drafting && (
              <button type="button" onClick={add} className="min-h-11 self-start font-medium text-indigo">
                {t.addCriterion}
              </button>
            )}

            {milestones.length > 0 && (
              <div className="animate-rise">
                <Eyebrow>{t.milestones}</Eyebrow>
                <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
                  {milestones.map((m, i) => (
                    <span key={m.id} className="rounded-full bg-sunk px-2.5 py-1.5">
                      {i + 1} · {m.title} · {t.days(m.estDays)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {meta && (
              <div className="flex animate-rise flex-col gap-3 rounded-xl border border-line bg-card p-4">
                {meta.artFormIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[14px]">
                    <span className="font-semibold text-muted">{t.artForms}:</span>
                    {meta.artFormIds.map((id) => (
                      <span key={id} className="rounded-full bg-sunk px-2.5 py-1">{artFormName(id, lang)}</span>
                    ))}
                  </div>
                )}
                <p className="m-0 flex items-center gap-1.5 text-[14px] text-ink-2">
                  <MapPin className="flex-none text-saffron" /> {meta.onSite ? t.onSite : t.remote}
                </p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-muted">{t.feeLabel}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={500}
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    aria-describedby="fee-hint"
                    className="h-12 rounded-lg border border-line-strong bg-paper px-3 text-lg font-semibold focus:border-indigo focus:outline-none"
                  />
                  <span id="fee-hint" className="text-[13px] text-muted">{t.feeHint(formatInr(meta.suggestedFeeInr))}</span>
                </label>
              </div>
            )}

            {error && <p role="alert" className="m-0 rounded-lg bg-[#f6e3de] px-3 py-2.5 text-[14px] text-fail">{error}</p>}
          </>
        )}

        {step === 3 && published && (
          <div className="flex flex-1 flex-col items-start gap-4 pt-6">
            <span className="flex size-14 animate-stamp items-center justify-center rounded-full bg-indigo text-white">
              <CheckCircleDraw size={30} />
            </span>
            <h1 className="m-0 font-serif text-[30px] leading-[1.15] font-semibold">{t.s3Title}</h1>
            <p className="m-0 text-[15px] font-semibold">{title}</p>
            <p className="m-0 text-[15px] text-muted">{t.s3Summary(published.n, published.days, formatInr(published.fee))}</p>
            <p className="m-0 text-base leading-normal text-ink-2">{t.s3Body}</p>
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-line bg-paper px-4 pt-3 pb-6">
        {step === 1 && (
          <PrimaryButton onClick={startDraft}>
            <Sparkle /> {t.s1Cta}
          </PrimaryButton>
        )}
        {step === 2 && (
          <>
            <PrimaryButton onClick={publish} disabled={drafting || publishing || approved.length === 0}>
              {publishing ? t.publishing : approved.length === 0 && !drafting ? t.needOne : t.continueN(approved.length, finished.length)}
            </PrimaryButton>
            <button type="button" onClick={startDraft} disabled={drafting} className="min-h-11 text-[15px] font-medium text-ink-2 disabled:opacity-50">
              {t.redo}
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <PrimaryButton onClick={reset}>{t.s3Another}</PrimaryButton>
            <Link href="/employer" className="flex min-h-11 items-center justify-center text-[15px] font-medium text-indigo">
              {t.s3View}
            </Link>
          </>
        )}
      </footer>
    </div>
  );
}

function CriterionRow({
  item,
  index,
  t,
  onToggle,
  onEdit,
  onSave,
  onRemove,
}: {
  item: Item;
  index: number;
  t: EmployerStrings;
  onToggle: () => void;
  onEdit: () => void;
  onSave: (text: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(item.text);
  useEffect(() => {
    if (item.editing) setDraft(item.text);
  }, [item.editing, item.text]);

  if (item.streaming) {
    return (
      <li className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong p-3">
        <span className="flex size-[22px] flex-none items-center justify-center">
          <span className="size-2 rounded-full bg-saffron" />
        </span>
        <span className="flex-1 text-[15px] leading-[1.4] text-ink-2">
          {item.text}
          <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 animate-caret bg-ink align-[-2px]" />
        </span>
      </li>
    );
  }

  if (item.editing) {
    return (
      <li className="flex animate-rise flex-col gap-2 rounded-xl border border-indigo bg-card p-3">
        <label className="sr-only" htmlFor={`crit-${item.id}`}>{t.newCriterion}</label>
        <textarea
          id={`crit-${item.id}`}
          autoFocus
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSave(draft);
            }
          }}
          className="w-full resize-none bg-transparent text-[15px] leading-[1.4] focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onRemove} aria-label={t.remove(index)} className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-sunk">
            <Trash />
          </button>
          <button type="button" onClick={() => onSave(draft)} className="min-h-11 rounded-lg bg-ink px-4 text-[15px] font-medium text-paper">
            {t.save}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex animate-rise items-start gap-3 rounded-xl border border-line bg-card p-3">
      <input type="checkbox" checked={item.approved} onChange={onToggle} aria-label={t.approve(index)} className="mt-px size-[22px] flex-none accent-indigo" />
      <span className="flex-1 text-[15px] leading-[1.4]">
        {item.text}
        {!item.aiGenerated && <span className="sr-only"> (added by you)</span>}
      </span>
      <button type="button" onClick={onEdit} aria-label={t.edit(index)} className="-m-1.5 flex size-11 flex-none items-center justify-center rounded-lg text-muted hover:bg-sunk">
        <Pencil />
      </button>
    </li>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Language" className="flex rounded-full border border-line-strong p-[3px]">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`h-9 min-w-10 rounded-full px-2 ${l === "hi" ? "font-deva text-sm font-medium" : "text-[13px] font-semibold"} ${
            lang === l ? "bg-ink text-paper" : "text-ink"
          }`}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <span key={n} className={`h-1 flex-1 rounded-sm transition-colors duration-300 ${n <= step ? "bg-indigo" : "bg-line"}`} />
      ))}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{children}</p>;
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-indigo text-base font-semibold text-white transition-colors hover:bg-indigo-deep disabled:bg-line-strong disabled:text-ink-2"
    >
      {children}
    </button>
  );
}
