import { redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { forms } from "@/server/market";
import { postCommission } from "@/server/actions";
import { language } from "@/i18n/language";
import { ActionForm } from "@/components/action-form";
import { CommissionFormFields } from "@/components/commission-form-fields";
import "@/components/commissions.css";

export default async function Page() {
  const [user, all, { lang, t }] = await Promise.all([viewer(), forms(), language()]);
  if (!user) redirect("/login");
  if (user.role !== "customer") redirect("/commissions");
  return <div className="commission-workspace">
    <Link className="back-link" href="/commissions">← {t("All commissions", "सभी कमीशन")}</Link>
    <header className="workspace-heading"><p className="meta">{t("A good project starts with a good brief", "अच्छे काम की शुरुआत स्पष्ट विवरण से होती है")}</p><h1>{t("What would you like made?", "आप क्या बनवाना चाहते हैं?")}</h1><p>{t("Give an artist the details they need to bring your idea to life.", "अपनी कल्पना को साकार करने के लिए कलाकार को ज़रूरी जानकारी दें।")}</p></header>
    <div className="commission-layout">
      <section className="workspace-panel">
        <ActionForm lang={lang} action={postCommission} label={t("Publish your brief", "अपना अनुरोध प्रकाशित करें")}>
          <label>{t("Project title", "प्रोजेक्ट का शीर्षक")}<input name="title" maxLength={120} required placeholder={t("A Warli mural for our café", "हमारे कैफ़े के लिए वारली चित्र")} /></label>
          <CommissionFormFields all={all} lang={lang} />
        </ActionForm>
        <Link className="quiet-link" href="/commissions">{t("Cancel and return", "रद्द करके वापस जाएँ")}</Link>
      </section>
      <aside className="commission-aside"><p className="meta">{t("What happens next", "इसके बाद क्या होगा")}</p><ol className="brief-guide">
        <li><strong>{t("Meet interested artists", "इच्छुक कलाकारों से मिलें")}</strong><p>{t("Receive private proposals at your budget or with a custom quotation.", "अपने बजट पर या कलाकार के सुझाए मूल्य पर निजी प्रस्ताव पाएँ।")}</p></li>
        <li><strong>{t("Talk, then accept a proposal", "बात करें, फिर प्रस्ताव स्वीकार करें")}</strong><p>{t("Use Work history to discuss the brief, deadline and payment before accepting a proposal and commissioning an artist.", "कार्य इतिहास में काम, समय-सीमा और भुगतान पर बात करें, फिर प्रस्ताव स्वीकार करके कलाकार को काम सौंपें।")}</p></li>
        <li><strong>{t("Review the finished work", "तैयार कार्य देखें")}</strong><p>{t("Follow progress privately, accept the submission, and decide whether to share it publicly.", "निजी रूप से प्रगति देखें, कार्य स्वीकार करें और तय करें कि उसे सार्वजनिक दिखाना है या नहीं।")}</p></li>
      </ol></aside>
    </div>
  </div>;
}
