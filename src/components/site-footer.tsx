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
        <p>{t("We’re building our first community. Examples marked “Sample data” help you explore the pilot, including its rankings and impact. They’re fictional and read-only.", "हम अपना पहला समुदाय बना रहे हैं। “नमूना डेटा” वाले काल्पनिक उदाहरण पायलट, उसकी रैंकिंग और प्रभाव को समझने के लिए हैं। ये केवल देखने के लिए हैं।")}</p>
      </div>
    </div>
  </footer>;
}
