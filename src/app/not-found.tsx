import Link from "next/link";
import { language } from "@/i18n/language";
export default async function Missing() {
  const { t } = await language();
  return (
    <>
      <h1>{t("Page not found", "पेज नहीं मिला")}</h1>
      <Link href="/">{t("Return home", "मुखपृष्ठ पर जाएँ")}</Link>
    </>
  );
}
