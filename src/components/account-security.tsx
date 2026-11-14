"use client";
import { useState } from "react";
import { changePassword, deleteAccount } from "@/server/actions";
import { ActionForm } from "./action-form";

export function AccountSecurity({ lang, admin }: { lang: "en" | "hi"; admin: boolean }) {
  const hi = lang === "hi";
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  return <div className="security-panels"><section className="profile-panel" aria-labelledby="password-title"><div className="section-heading"><div><h2 id="password-title">{hi ? "पासवर्ड बदलें" : "Change password"}</h2><p>{hi ? "बदलने के बाद सभी डिवाइस पर फिर से लॉग इन करना होगा।" : "You’ll sign in again on every device after changing your password."}</p></div></div><ActionForm action={changePassword} lang={lang} label={hi ? "पासवर्ड अपडेट करें" : "Update password"}><label>{hi ? "वर्तमान पासवर्ड" : "Current password"}<input type="password" name="current" required maxLength={128} autoComplete="current-password" /></label><label>{hi ? "नया पासवर्ड" : "New password"}<input type="password" name="password" required minLength={6} maxLength={128} autoComplete="new-password" /><small>{hi ? "6–128 अक्षर रखें।" : "Use 6–128 characters."}</small></label></ActionForm></section>
    {!admin && <section className="profile-panel account-danger" aria-labelledby="delete-account-title"><div className="section-heading"><div><h2 id="delete-account-title">{hi ? "खाता हटाएँ" : "Delete account"}</h2><p>{hi ? "आपकी सार्वजनिक प्रोफ़ाइल और पोर्टफ़ोलियो हटा दिए जाएँगे। साझा कार्य का इतिहास दूसरे पक्ष के लिए सुरक्षित रहेगा, पर आपकी पहचान छिपा दी जाएगी।" : "Your public profile and portfolio will be removed. Shared work history is retained for the other party with your identity anonymized."}</p></div></div><p className="form-hint">{hi ? "खाता हटाने से पहले चालू कमीशन पूरे करें या उन्हें रद्द करें। यह बदलाव वापस नहीं लिया जा सकता।" : "Finish or cancel active commissions first. This cannot be undone."}</p>
      {!confirming ? <button type="button" className="button secondary danger-button" onClick={() => setConfirming(true)}>{hi ? "खाता हटाएँ" : "Delete my account"}</button> : <ActionForm action={async (state, data) => { setBusy(true); try { return await deleteAccount(state, data); } finally { setBusy(false); } }} lang={lang} label={hi ? "हमेशा के लिए खाता हटाएँ" : "Permanently delete account"} secondaryAction={<button type="button" className="button secondary" disabled={busy} onClick={() => setConfirming(false)}>{hi ? "खाता रखें" : "Keep my account"}</button>}><label>{hi ? "वर्तमान पासवर्ड" : "Current password"}<input type="password" name="current" required maxLength={128} autoComplete="current-password" autoFocus /></label><label>{hi ? "पुष्टि करने के लिए DELETE लिखें" : "Type DELETE to confirm"}<input name="confirm" required pattern="DELETE" autoComplete="off" spellCheck={false} placeholder="DELETE" /></label></ActionForm>}
    </section>}
  </div>;
}
