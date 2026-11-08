"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Criterion, DraftSpecEvent, Milestone } from "@/contract/schemas";
import { CheckCircleDraw, ChevronLeft, Pencil, Sparkle, Trash } from "@/components/icons";
import { api, streamDraftSpec } from "@/lib/api";
import { DEMO_ORG_ID } from "@/lib/demo";
import { orgStrings, type Lang } from "@/i18n/org";
import { useLang } from "@/i18n/use-lang";

type Item = Criterion & { streaming: boolean; editing: boolean };
type Step = 1 | 2 | 3;

export function NewTaskFlow() {
  const [lang, setLang] = useLang();
  const t = orgStrings[lang];

  const [step, setStep] = useState<Step>(1);
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [meta, setMeta] = useState<{ skills: string[]; estHours: number }>({ skills: [], estHours: 1 });
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ id: string; n: number; hours: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const tooShort = raw.trim().length < 10;

  function onEvent(e: DraftSpecEvent) {
    switch (e.type) {
      case "title":
        setTitle(e.title);
        break;
      case "criterion_start":
        setItems((xs) => [...xs, { id: e.id, text: "", testable: true, aiGenerated: true, approved: false, streaming: true, editing: false }]);
        break;
      case "criterion_delta":
        setItems((xs) => xs.map((x) => (x.id === e.id ? { ...x, text: x.text + e.text } : x)));
        break;
      case "criterion_end":
        setItems((xs) => xs.map((x) => (x.id === e.id ? { ...x, text: x.text.trim(), testable: e.testable, streaming: false } : x)));
        break;
      case "milestone":
        setMilestones((ms) => [...ms, e.milestone]);
        break;
      case "meta":
        setMeta({ skills: e.skills, estHours: e.estHours });
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
    setError(null);
    setDrafting(true);
    try {
      await streamDraftSpec(raw.trim(), onEvent, ctrl.signal);
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
    setItems((xs) => [
      ...xs,
      { id: `u${Date.now()}`, text: "", testable: true, aiGenerated: false, approved: true, streaming: false, editing: true },
    ]);

  const finished = items.filter((x) => !x.streaming && x.text.trim());
  const approved = finished.filter((x) => x.approved);

  async function publish() {
    if (!approved.length) return;
    setPublishing(true);
    setError(null);
    try {
      const ids = new Set(approved.map((x) => x.id));
      // The agent estimated hours for every drafted criterion; scale to what the NGO kept.
      const estHours = Math.max(1, Math.round((meta.estHours * approved.length) / Math.max(1, finished.length)));
      const task = await api.tasks.create({ orgId: DEMO_ORG_ID, rawRequest: raw.trim(), title: title || undefined });
      await api.tasks.update(task.id, {
        status: "open",
        skills: meta.skills,
        estHours,
        criteria: approved.map(({ id, text, testable, aiGenerated }) => ({ id, text: text.trim(), testable, aiGenerated, approved: true })),
        milestones: milestones
          .map((m) => ({ ...m, criterionIds: m.criterionIds.filter((c) => ids.has(c)) }))
          .filter((m) => m.criterionIds.length),
      });
      setPublished({ id: task.id, n: approved.length, hours: estHours });
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
        <span className="font-serif text-[19px] font-semibold">{t.newTask}</span>
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
              {touched && tooShort && (
                <span id="raw-err" className="text-[14px] text-fail">{t.s1TooShort}</span>
              )}
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

            <div className="flex items-center justify-between gap-3 text-[13px] text-ink-2">
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
            <p className="m-0 text-[15px] text-muted">{t.s3Summary(published.n, published.hours)}</p>
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
            <Link href="/org" className="flex min-h-11 items-center justify-center text-[15px] font-medium text-indigo">
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
  t: (typeof orgStrings)["en"];
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
      <input
        type="checkbox"
        checked={item.approved}
        onChange={onToggle}
        aria-label={t.approve(index)}
        className="mt-px size-[22px] flex-none accent-indigo"
      />
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
