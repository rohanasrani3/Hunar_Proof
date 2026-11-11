import Link from "next/link";
import { language } from "@/i18n/language";
import { Logo } from "./icons";

export async function SiteFooter() {
  const { t } = await language();
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div>
        <Link className="brand" href="/"><Logo size={24} /> KareGhar</Link>
        <p>{t("Empowering artisans. Enabling businesses", "कारीगरों को सशक्त बनाना। व्यवसायों को सक्षम बनाना")}</p>
      </div>
      <nav aria-label={t("Footer navigation", "फ़ुटर नेविगेशन")}>
        <strong>{t("Explore", "देखें")}</strong>
        <Link href="/">{t("Home", "मुख्य पृष्ठ")}</Link>
        <Link href="/talent">{t("Find artists", "कलाकार खोजें")}</Link>
        <Link href="/commissions">{t("Commission work", "कमीशन कार्य")}</Link>
        <Link href="/impact">{t("Impact", "प्रभाव")}</Link>
      </nav>
      <div>
        <strong>{t("About sample content", "नमूना सामग्री के बारे में")}</strong>
        <p>{t("Examples are marked “Sample data”. They are read-only and do not count toward artist rankings or impact totals.", "उदाहरण “नमूना डेटा” के रूप में चिह्नित हैं। वे केवल देखने के लिए हैं और कलाकार रैंकिंग या प्रभाव के आँकड़ों में नहीं गिने जाते।")}</p>
      </div>
    </div>
  </footer>;
}
