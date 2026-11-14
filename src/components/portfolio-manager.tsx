"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { Form, Work } from "@/contract/schemas";
import { CATEGORIES } from "@/contract/artForms";
import { addWork, updateWork, deleteWork } from "@/server/actions";
import { ActionForm } from "./action-form";
import { mediaKind } from "./portfolio-gallery";

function WorkDialog({ work, all, lang, onClose, onSaved }: { work: Work | null; all: Form[]; lang: "en" | "hi"; onClose: () => void; onSaved: () => void }) {
  const hi = lang === "hi";
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const currentForm = all.find((item) => item.id === work?.form);
  const [category, setCategory] = useState(currentForm?.category ?? "painting");
  const [form, setForm] = useState(currentForm?.id ?? "");
  const [source, setSource] = useState<"link" | "upload">(work?.url.startsWith("/api/media/") ? "upload" : "link");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const selectedForm = all.find((item) => item.id === form);
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.showModal();
    return () => { node?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const action = deleting ? deleteWork : work ? updateWork : addWork;
  return <dialog ref={dialog} className="profile-dialog" aria-labelledby={headingId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className="dialog-heading"><div><p className="meta">{hi ? "आपका पोर्टफ़ोलियो" : "Your portfolio"}</p><h2 id={headingId}>{deleting ? hi ? "यह कार्य हटाएँ?" : "Remove this work?" : work ? hi ? "कार्य संपादित करें" : "Edit work" : hi ? "नई कलाकृति जोड़ें" : "Add a piece of work"}</h2></div><button type="button" className="icon-button" disabled={busy} onClick={onClose} aria-label={hi ? "बंद करें" : "Close dialog"}>×</button></div>
    <ActionForm key={deleting ? "delete" : "edit"} action={async (state, data) => { setBusy(true); try { return await action(state, data); } finally { setBusy(false); } }} lang={lang} label={deleting ? hi ? "कार्य हटाएँ" : "Remove work" : work ? hi ? "बदलाव सहेजें" : "Save changes" : hi ? "पोर्टफ़ोलियो में जोड़ें" : "Add to portfolio"} onSuccess={onSaved} secondaryAction={<button type="button" className="button secondary" disabled={busy} onClick={() => deleting ? setDeleting(false) : onClose()}>{hi ? "रद्द करें" : "Cancel"}</button>}>
      {work && <input type="hidden" name="id" value={work.id} />}
      {deleting ? <p>{hi ? `“${work?.title}” आपके सार्वजनिक पोर्टफ़ोलियो से हट जाएगा। आपका कमीशन इतिहास नहीं बदलेगा।` : `“${work?.title}” will be removed from your public portfolio. Your commission history will stay unchanged.`}</p> : <fieldset disabled={busy} className="profile-edit-fields">
        <label>{hi ? "कार्य का शीर्षक" : "Work title"}<input name="title" defaultValue={work?.title ?? ""} required maxLength={120} autoFocus placeholder={hi ? "जैसे, गाँव का उत्सव — वारली चित्र" : "For example, Village celebration — a Warli painting"} /></label>
        <div className="profile-form-grid"><label>{hi ? "कला श्रेणी" : "Art category"}<select name="category" value={category} onChange={(event) => { setCategory(event.target.value as Form["category"]); setForm(""); }}>{Object.entries(CATEGORIES).map(([id, name]) => <option key={id} value={id}>{name[lang]}</option>)}</select></label>
          <label>{hi ? "कला विधा" : "Art form"}<select value={form} required onChange={(event) => setForm(event.target.value)}><option value="" disabled>{hi ? "एक विधा चुनें" : "Choose a form"}</option>{all.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{hi ? item.hi : item.name}</option>)}<option value="__other__">{hi ? "अन्य — नई विधा जोड़ें" : "Other — add a new form"}</option></select></label></div>
        {form === "__other__" ? <label>{hi ? "विधा का नाम" : "Name of the art form"}<input name="formName" required maxLength={120} placeholder={hi ? "अपनी कला विधा का नाम लिखें" : "Enter your art form"} /></label> : <input type="hidden" name="formName" value={selectedForm?.name ?? ""} />}
        <fieldset className="work-source"><legend>{hi ? "अपना कार्य दिखाएँ" : "Show your work"}</legend><div className="view-switch" role="group" aria-label={hi ? "कार्य जोड़ने का तरीका" : "How to add your work"}><button type="button" aria-pressed={source === "link"} onClick={() => setSource("link")}>{hi ? "लिंक जोड़ें" : "Paste a link"}</button><button type="button" aria-pressed={source === "upload"} onClick={() => setSource("upload")}>{hi ? "फ़ाइल अपलोड करें" : "Upload a file"}</button></div></fieldset>
        {source === "link" ? <label>{hi ? "कार्य का सार्वजनिक लिंक" : "Public link to your work"}<input name="url" type="url" defaultValue={work?.url.startsWith("http") ? work.url : ""} required placeholder="https://" maxLength={2048} /><small>{hi ? "चित्र, ऑडियो या वीडियो का सीधा लिंक यहीं दिखेगा। अन्य लिंक नई विंडो में खुलेंगे।" : "Direct image, audio and video links play here. Other links open in a new window."}</small></label> : <div className="work-upload"><label>{work ? hi ? "नई फ़ाइल (वैकल्पिक)" : "Replace file (optional)" : hi ? "कार्य की फ़ाइल" : "Work file"}<input type="file" name="file" accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,video/mp4" required={!work} onChange={(event) => { const file = event.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) { setFileError(hi ? "फ़ाइल अधिकतम 5 MB की हो सकती है।" : "Choose a file up to 5 MB."); setFileName(""); event.target.value = ""; } else { setFileError(""); setFileName(file?.name ?? ""); } }} /><small>{hi ? "JPG, PNG, WebP, MP3, WAV या MP4 · अधिकतम 5 MB" : "JPG, PNG, WebP, MP3, WAV or MP4 · up to 5 MB"}</small></label>{work && <input type="hidden" name="url" value={work.url} />}{fileName && <small>{fileName}</small>}{fileError && <small role="alert">{fileError}</small>}</div>}
        <p className="form-hint">{hi ? "केवल अपना बनाया हुआ काम या वह काम जोड़ें जिसे साझा करने की अनुमति है।" : "Add work you created or have permission to share."}</p>
      </fieldset>}
    </ActionForm>
    {work && !deleting && <div className="dialog-delete"><button type="button" className="text-button quiet-danger" disabled={busy} onClick={() => setDeleting(true)}>{hi ? "पोर्टफ़ोलियो से हटाएँ" : "Remove from portfolio"}</button></div>}
  </dialog>;
}

export function PortfolioManager({ items, all, lang, onboarding = false }: { items: Work[]; all: Form[]; lang: "en" | "hi"; onboarding?: boolean }) {
  const hi = lang === "hi";
  const [editing, setEditing] = useState<Work | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  return <section className="portfolio-manager" aria-labelledby="portfolio-title">
    <div className="section-heading"><div><h2 id="portfolio-title">{hi ? "आपका पोर्टफ़ोलियो" : "Your portfolio"}</h2><p>{hi ? "हर कलाकृति ग्राहकों को आपका काम समझने में मदद करती है।" : "Give customers a feel for what you make."}</p></div>{items.length > 0 && <button type="button" className="button" onClick={() => { setSaved(false); setEditing(null); }}>{hi ? "+ कार्य जोड़ें" : "+ Add work"}</button>}</div>
    {saved && <p className="profile-success" role="status">{hi ? "पोर्टफ़ोलियो अपडेट हो गया।" : "Your portfolio has been updated."}</p>}
    {items.length === 0 ? <div className="portfolio-empty"><div className="empty-art" aria-hidden="true"><span>✳</span></div><p className="meta">{onboarding ? hi ? "KareGhar में आपका स्वागत है" : "Welcome to KareGhar" : hi ? "अपनी कला को जगह दें" : "Make room for your craft"}</p><h3>{hi ? "आपका पहला काम, आपकी पहली छाप।" : "Your first piece makes an introduction."}</h3><p>{hi ? "एक चित्र, रिकॉर्डिंग, वीडियो या लिंक जोड़ें। अपनी कला विधा चुनें ताकि सही ग्राहक आपको ढूँढ सकें।" : "Add a photograph, recording, video or link. Choose your art form so the right customers can find you."}</p><button type="button" className="button" onClick={() => setEditing(null)}>{hi ? "अपना पहला कार्य जोड़ें" : "Add your first work"}</button></div> : <><div className="portfolio-manager-grid">{items.map((item) => <article className="managed-work" key={item.id}>
      <div className="managed-work-image">{mediaKind(item.url) === "image" ? <Image src={item.url} alt={item.title} width={480} height={320} unoptimized /> : <span aria-hidden="true">{mediaKind(item.url) === "audio" ? "♫" : mediaKind(item.url) === "video" ? "▶" : "↗"}</span>}</div>
      <div className="managed-work-caption"><div><small>{all.find((form) => form.id === item.form)?.[hi ? "hi" : "name"] ?? item.form}</small><h3>{item.title}</h3></div><button type="button" className="icon-button" aria-label={hi ? `${item.title} संपादित करें` : `Edit ${item.title}`} onClick={() => { setSaved(false); setEditing(item); }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg></button></div>
    </article>)}</div><button className="add-work-tile" type="button" onClick={() => { setSaved(false); setEditing(null); }}><span aria-hidden="true">+</span>{hi ? "और कार्य जोड़ें" : "Add more work"}<small>{hi ? "आपकी अगली कलाकृति के लिए जगह है।" : "There’s room for your next piece."}</small></button></>}
    {editing !== undefined && <WorkDialog work={editing} all={all} lang={lang} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); setSaved(true); }} />}
  </section>;
}
