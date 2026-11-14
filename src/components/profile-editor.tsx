"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { Account } from "@/contract/schemas";
import { updateProfile } from "@/server/actions";
import { ActionForm } from "./action-form";
import { SOCIALS, SocialIcon, SocialLinks, socialKey } from "./social-links";

type ProfileData = Pick<Account, "name" | "username" | "email" | "company" | "photo" | "role" | "bio" | "contact">;

export function ProfileAvatar({ name, photo }: { name: string; photo: string }) {
  return photo ? <Image width={112} height={112} unoptimized className="profile-avatar" src={photo.startsWith("blob:") ? photo : "/api/media/" + photo} alt="" /> : <span className="profile-avatar-placeholder" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>;
}

function PhotoEditor({ user, hi }: { user: ProfileData; hi: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [preview, setPreview] = useState("");
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <div className="photo-editor-row">
    <div className="photo-editor">
      <button type="button" className="avatar-button" onClick={() => input.current?.click()} aria-label={hi ? "प्रोफ़ाइल फ़ोटो बदलें" : "Change profile photo"} aria-describedby={id + "-hint"}>
        <ProfileAvatar name={user.name} photo={removed ? "" : preview || user.photo} />
        <span className="avatar-overlay"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M4 6h4l2-3h4l2 3h4v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.8"/></svg></span>
      </button>
      <input ref={input} id={id} className="sr-only" type="file" name="photo" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label={hi ? "प्रोफ़ाइल फ़ोटो" : "Profile photo"} onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setError(hi ? "5 MB तक की JPG, PNG या WebP फ़ाइल चुनें।" : "Choose a JPG, PNG or WebP image up to 5 MB.");
          event.target.value = "";
          setPreview("");
          return;
        }
        setError(""); setRemoved(false); setPreview(URL.createObjectURL(file));
      }} />
      <input type="hidden" name="removePhoto" value={removed ? "on" : ""} />
    </div>
    <div className="photo-editor-copy">
      <button type="button" className="text-button" onClick={() => input.current?.click()}>{hi ? "फ़ोटो बदलें" : user.photo || preview ? "Change photo" : "Add a photo"}</button>
      {(user.photo || preview) && !removed && <button type="button" className="text-button quiet-danger" onClick={() => { setRemoved(true); setPreview(""); if (input.current) input.current.value = ""; }}>{hi ? "हटाएँ" : "Remove"}</button>}
      <small id={id + "-hint"}>{hi ? "JPG, PNG या WebP · अधिकतम 5 MB" : "JPG, PNG or WebP · up to 5 MB"}</small>
      {error && <small role="alert">{error}</small>}
    </div>
  </div>;
}

export function ProfileEditor({ user, links, lang }: { user: ProfileData; links: string[]; lang: "en" | "hi" }) {
  const hi = lang === "hi";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const finish = () => { setEditing(false); setSaved(true); requestAnimationFrame(() => editButton.current?.focus()); };
  const cancel = () => { setEditing(false); requestAnimationFrame(() => editButton.current?.focus()); };
  return <section className="profile-panel" aria-labelledby="personal-title">
    <div className="section-heading"><div><h2 id="personal-title">{hi ? "व्यक्तिगत जानकारी" : "Personal information"}</h2><p>{hi ? "आपका परिचय और संपर्क, एक जगह।" : "Your introduction and contact details, in one place."}</p></div>
      {!editing && <button ref={editButton} className="button secondary" type="button" onClick={() => { setSaved(false); setEditing(true); }}>{hi ? "प्रोफ़ाइल संपादित करें" : "Edit profile"}</button>}
    </div>
    {saved && !editing && <p className="profile-success" role="status">{hi ? "आपकी प्रोफ़ाइल अपडेट हो गई है।" : "Your profile is up to date."}</p>}
    {editing ? <ActionForm action={async (state, data) => { setSaving(true); try { return await updateProfile(state, data); } finally { setSaving(false); } }} lang={lang} label={hi ? "बदलाव सहेजें" : "Save changes"} onSuccess={finish} secondaryAction={<button className="button secondary" type="button" disabled={saving} onClick={cancel}>{hi ? "रद्द करें" : "Cancel"}</button>}>
      <fieldset disabled={saving} className="profile-edit-fields">
        <PhotoEditor user={user} hi={hi} />
        <div className="profile-form-grid">
          <label>{hi ? "नाम" : "Full name"}<input name="name" defaultValue={user.name} required maxLength={120} autoComplete="name" autoFocus /></label>
          <label>{hi ? "कंपनी या स्टूडियो (वैकल्पिक)" : "Company or studio (optional)"}<input name="company" defaultValue={user.company} maxLength={120} autoComplete="organization" /></label>
        </div>
        <label>{hi ? "परिचय" : "Bio"}<textarea name="bio" rows={5} maxLength={2000} defaultValue={user.bio} placeholder={hi ? "अपने काम, अनुभव और रुचियों के बारे में बताएँ।" : "Tell people about your work, experience and what you enjoy creating."} /><small>{hi ? "यह आपके सार्वजनिक प्रोफ़ाइल पर दिखाई देगा।" : "Shown on your public profile."}</small></label>
        <label>{hi ? "सार्वजनिक संपर्क (वैकल्पिक)" : "Public contact (optional)"}<input name="contact" maxLength={240} defaultValue={user.contact} placeholder={hi ? "व्यावसायिक ईमेल, फ़ोन या संपर्क का पसंदीदा तरीका" : "Business email, phone, or your preferred way to connect"} /><small>{hi ? "यह जानकारी सभी देख सकते हैं। केवल वही साझा करें जो आप सार्वजनिक करना चाहते हैं।" : "Visible to everyone. Share only details you want to make public."}</small></label>
        <label>{hi ? "खाते का ईमेल" : "Account email"}<input name="email" type="email" defaultValue={user.email} required={user.role !== "admin"} maxLength={254} autoComplete="email" /><small>{hi ? "निजी — सार्वजनिक प्रोफ़ाइल पर नहीं दिखाया जाएगा।" : "Private — never displayed on your public profile."}</small></label>
        <fieldset className="social-fields"><legend>{hi ? "सोशल लिंक" : "Find you online"}</legend><div className="profile-form-grid">{SOCIALS.map((site) => <label key={site.key}><span className="social-field-label"><SocialIcon name={site.key} /> {site.label}</span><input name={"social_" + site.key} type="url" maxLength={2048} placeholder={"https://" + site.hosts[0] + "/"} defaultValue={links.find((link) => socialKey(link) === site.key) ?? ""} /></label>)}</div><input type="hidden" name="linksExtra" value={JSON.stringify(links.filter((link) => !socialKey(link)))} /></fieldset>
      </fieldset>
    </ActionForm> : <>
      <div className="profile-read-intro"><button type="button" className="profile-photo-shortcut" onClick={() => { setSaved(false); setEditing(true); }} aria-label={hi ? "प्रोफ़ाइल फ़ोटो बदलें" : "Change profile photo"}><ProfileAvatar name={user.name} photo={user.photo} /><span className="avatar-overlay" aria-hidden="true">✎</span></button><div><h3>{user.name}</h3><p>@{user.username}{user.company ? ` · ${user.company}` : ""}</p></div></div>
      <dl className="profile-details"><div><dt>{hi ? "परिचय" : "About me"}</dt><dd className="pre">{user.bio || (hi ? "अपने बारे में कुछ बताएँ — प्रोफ़ाइल संपादित करके शुरुआत करें।" : "Add a short introduction so people can get to know you.")}</dd></div><div><dt>{hi ? "सार्वजनिक संपर्क" : "Public contact"}</dt><dd>{user.contact || (hi ? "अभी साझा नहीं किया गया" : "Not shared yet")}</dd></div><div><dt>{hi ? "निजी ईमेल" : "Private account email"}</dt><dd>{user.email || "—"}</dd></div></dl>
      {links.length > 0 && <div className="profile-social-section"><h3>{hi ? "सोशल लिंक" : "Find me online"}</h3><SocialLinks links={links} /></div>}
    </>}
  </section>;
}
