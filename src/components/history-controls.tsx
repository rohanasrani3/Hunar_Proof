"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ProposalForm } from "@/components/proposal-form";
import { sendMessage } from "@/server/history-actions";

export function ProposalEditor({ id, fee, hi, proposal, now }: { id: string; fee: number; hi: boolean; proposal: { message: string; pricing: string; quote: number; created: number }; now: number }) {
  const [editing, setEditing] = useState(false);
  const [clock, setClock] = useState(now);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 10000); return () => window.clearInterval(timer); }, []);
  const remaining = Math.max(0, Math.ceil((Number(proposal.created) + 15 * 60000 - clock) / 60000));
  if (!remaining) return <p className="field-help">{hi ? "संपादन का समय समाप्त हो गया है। बदलाव पर संदेशों में चर्चा करें।" : "The editing window has closed. Discuss any changes in messages."}</p>;
  return <div className="proposal-edit">
    <p className="field-help">{hi ? remaining + " मिनट तक प्रस्ताव संपादित कर सकते हैं।" : "You can edit this proposal for another " + remaining + " minute" + (remaining === 1 ? "." : "s.")}</p>
    {editing ? <ProposalForm id={id} fee={fee} hi={hi} edit={proposal} onCancel={() => setEditing(false)} /> : <button className="pill" type="button" onClick={() => setEditing(true)}>{hi ? "प्रस्ताव संपादित करें" : "Edit proposal"}</button>}
  </div>;
}

export function MessageComposer({ id, artist, hi }: { id: string; artist: string; hi: boolean }) {
  const [body, setBody] = useState("");
  const router = useRouter();
  return <ActionForm action={sendMessage} lang={hi ? "hi" : "en"} label={hi ? "संदेश भेजें" : "Send message"} onSuccess={() => { setBody(""); router.refresh(); }} className="message-composer">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="artist" value={artist} />
    <label>{hi ? "आपका संदेश" : "Your message"}<textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} required rows={3} placeholder={hi ? "काम, समय-सीमा और शर्तों पर बात करें…" : "Discuss the work, timing and terms…"} /></label>
  </ActionForm>;
}

export function HistoryRefresh({ hi }: { hi: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [router]);
  return <button className="quiet-button" type="button" onClick={() => router.refresh()}>{hi ? "अपडेट देखें" : "Refresh updates"} ↻</button>;
}
