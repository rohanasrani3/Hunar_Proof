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
  expired: ["The 15-minute editing window has ended.", "संपादन के लिए 15 मिनट का समय समाप्त हो गया है।"],
  active: ["Complete or cancel your active commissions before deleting your account.", "खाता हटाने से पहले सक्रिय कमीशन पूरे करें या रद्द करें।"],
  acknowledged: ["Please confirm that you will contact the other person before starting work.", "कृपया पुष्टि करें कि काम शुरू करने से पहले आप दूसरे व्यक्ति से संपर्क करेंगे।"],
};
export function ActionForm({
  action,
  label,
  lang,
  children,
  onSuccess,
  secondaryAction,
  className = "",
}: {
  action: (state: string, data: FormData) => Promise<string>;
  label: string;
  lang: "hi" | "en";
  children?: React.ReactNode;
  onSuccess?: () => void;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(async (previous: string, data: FormData) => {
    const result = await action(previous, data);
    if (result === "saved") onSuccess?.();
    return result;
  }, "");
  return (
    <form action={submit} className={`stack ${className}`} aria-busy={pending}>
      {children}
      <div className="form-actions">
        <button className="button" disabled={pending}>
          {pending ? (lang === "hi" ? "सहेज रहे हैं…" : "Saving…") : label}
        </button>
        {secondaryAction}
      </div>
      <span role="status" className={`form-feedback ${state === "saved" ? "success" : "error"}`}>
        {state && (messages[state] ?? messages.invalid)[lang === "hi" ? 1 : 0]}
      </span>
    </form>
  );
}
