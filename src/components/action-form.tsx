"use client";
import { useActionState } from "react";
const messages: Record<string, [string, string]> = {
  invalid: ["Check the fields and try again.", "कृपया दर्ज जानकारी जाँचें।"],
  taken: [
    "Username or email already in use.",
    "उपयोगकर्ता नाम या ईमेल पहले से दर्ज है।",
  ],
  denied: [
    "Check your credentials and account permissions.",
    "अपना पासवर्ड और खाते की अनुमति जाँचें।",
  ],
  file: [
    "Choose a supported file up to 5 MB.",
    "5 MB तक की समर्थित फ़ाइल चुनें।",
  ],
  conflict: [
    "This action is no longer available. Refresh the page.",
    "यह कार्रवाई अब उपलब्ध नहीं है। पेज रीफ़्रेश करें।",
  ],
  saved: ["Saved.", "सहेजा गया।"],
};
export function ActionForm({
  action,
  label,
  lang,
  children,
}: {
  action: (state: string, data: FormData) => Promise<string>;
  label: string;
  lang: "hi" | "en";
  children?: React.ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, "");
  return (
    <form action={submit} className="stack">
      {children}
      <button className="button" disabled={pending}>
        {label}
      </button>
      <span role="status">
        {state && messages[state]?.[lang === "hi" ? 1 : 0]}
      </span>
    </form>
  );
}
