import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { commissions, forms } from "@/server/market";
import { historyDetail } from "@/server/history";
import { language } from "@/i18n/language";
import { Sample, stateName } from "@/components/discovery";
import { ProposalForm } from "@/components/proposal-form";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { OUTPUT_LABELS, deadlineDate, mediaUrl, rupees } from "@/lib/commission-display";
import "@/components/commissions.css";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user, { lang, t }, all] = await Promise.all([params, viewer(), language(), forms()]);
  if (user && await historyDetail(id, user.id)) redirect("/profile/history/" + id);
  const [c] = await commissions({}, id, user?.id);
  if (!c || c.status === "progress") notFound();
  const form = all.find((f) => f.id === c.form);
  const formLabel = form?.[lang === "hi" ? "hi" : "name"] ?? c.form;
  return <div className="commission-workspace public-commission">
    <Link className="back-link" href="/commissions">← {t("All commissions", "सभी कमीशन")}</Link>
    <header className="workspace-heading">
      <div className="commission-meta"><span className={"work-state state-" + c.status}>{stateName(c.status, lang === "hi")}</span><span>{formLabel}</span>{Boolean(c.sample) && <Sample />}</div>
      <h1>{c.title}</h1>
    </header>
    <div className="commission-layout">
      <div className="commission-main">
        <section className="workspace-panel">
          <h2>{t("The brief", "कार्य का विवरण")}</h2>
          <p className="pre">{c.brief}</p>
          <dl className="commission-facts">
            <div><dt>{t("Output format", "तैयार कार्य का रूप")}</dt><dd>{OUTPUT_LABELS[c.output_type]?.[lang === "hi" ? 1 : 0] ?? t("To be discussed", "बात करके तय करें")}</dd></div>
            <div><dt>{t("Proposed budget", "प्रस्तावित बजट")}</dt><dd>{rupees(c.original_fee)}</dd></div>
            <div><dt>{t("Work deadline", "कार्य की समय-सीमा")}</dt><dd>{deadlineDate(c.deadline, lang === "hi")}</dd></div>
          </dl>
          {c.reference && <figure className="commission-reference"><Image src={mediaUrl(c.reference)} width={900} height={600} unoptimized alt={t("Reference supplied by the customer", "ग्राहक का संदर्भ चित्र")} /><figcaption>{t("Reference supplied by the customer", "ग्राहक का संदर्भ चित्र")}</figcaption></figure>}
        </section>
        {c.output && <section className="workspace-panel"><h2>{t("Finished work", "तैयार कार्य")}</h2><PortfolioGallery hi={lang === "hi"} items={[{ id: c.id, title: c.title, url: mediaUrl(c.output), formLabel }]} /></section>}
        {c.status === "finding" && !c.sample && user?.role === "artist" && !c.paused && <section className="workspace-panel" id="proposal"><p className="meta">{t("Start a conversation", "बातचीत शुरू करें")}</p><h2>{t("Make it yours", "अपना प्रस्ताव भेजें")}</h2><ProposalForm id={id} fee={c.fee} hi={lang === "hi"} /></section>}
      </div>
      <aside className="commission-aside">
        <div className="customer-contact"><p className="meta">{t("Commissioned by", "अनुरोधकर्ता")}</p><Link className="customer-name" href={"/people/" + c.customer_username}>{c.customer_name}</Link><p className="contact-caption">{t("Contact", "संपर्क")}</p><p className="pre">{c.customer_contact || t("Send a proposal to start a private conversation.", "निजी बातचीत शुरू करने के लिए प्रस्ताव भेजें।")}</p></div>
        {Boolean(c.sample) ? <div className="subtle-notice"><strong>{t("A glimpse of what's possible", "संभावनाओं की एक झलक")}</strong><p>{t("This fictional brief demonstrates the pilot. Explore the details; sample projects do not accept proposals.", "यह काल्पनिक अनुरोध पायलट का उदाहरण है। नमूना प्रोजेक्ट पर प्रस्ताव नहीं भेजे जा सकते।")}</p></div> : c.status === "finding" && !user ? <Link className="button" href="/login">{t("Sign in to send a proposal", "प्रस्ताव भेजने के लिए लॉग इन करें")}</Link> : null}
        {!c.sample && c.status === "finding" && user?.role === "artist" && <a className="button" href="#proposal">{t("Send a proposal", "प्रस्ताव भेजें")} ↗</a>}
        <p className="field-help">{t("Agree on the work and payment directly before getting started.", "शुरू करने से पहले कार्य और भुगतान की शर्तें आपस में तय करें।")}</p>
      </aside>
    </div>
  </div>;
}
