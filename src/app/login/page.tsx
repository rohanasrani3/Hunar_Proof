import Link from "next/link";
import { Login } from "@/components/session-controls";
import { language } from "@/i18n/language";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; changed?: string }>;
}) {
  const { t, lang } = await language(),
    params = await searchParams;
  return (
    <section className="narrow">
      <h1>{t("Log in", "लॉग इन")}</h1>
      {params.created && (
        <p>
          {t(
            "Account created. Log in to continue.",
            "खाता बन गया। आगे बढ़ने के लिए लॉग इन करें।",
          )}
        </p>
      )}
      {params.changed && (
        <p>
          {t(
            "Password changed. Log in again.",
            "पासवर्ड बदल गया। फिर से लॉग इन करें।",
          )}
        </p>
      )}
      <Login hi={lang === "hi"} />
      <Link href="/signup">{t("Create an account", "नया खाता बनाएँ")}</Link>
    </section>
  );
}
