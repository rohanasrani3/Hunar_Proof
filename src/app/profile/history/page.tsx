import Link from "next/link";
import { redirect } from "next/navigation";
import { viewer } from "@/server/auth";
import { history } from "@/server/history";
import { language } from "@/i18n/language";
import { forms } from "@/server/market";
import { ProfileTabs } from "@/components/profile-tabs";
import { stateName, Sample } from "@/components/discovery";
import { activityDate, deadlineDate, rupees } from "@/lib/commission-display";
import "@/components/commissions.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [user, { t, lang }, params] = await Promise.all([viewer(), language(), searchParams]);
  if (!user) redirect("/login");
  const [allJobs, catalogue] = await Promise.all([history(user.id), forms()]);
  const unread = allJobs.reduce((total, job) => total + Number(job.unread), 0);
  const filter = ["all", "done", "unread"].includes(params.view ?? "") ? params.view : "active";
  const jobs = allJobs.filter((job) => filter === "active" ? job.status !== "done" : filter === "done" ? job.status === "done" : filter === "unread" ? Number(job.unread) > 0 : true);
  return <section className="history-workspace">
    <header className="workspace-heading"><p className="meta">{t("Your workspace", "आपका कार्यस्थल")}</p><h1>{t("Work history", "कार्य इतिहास")}{unread > 0 && <span className="history-count">{unread}</span>}</h1><p>{t("Every brief, conversation and finished piece, in one place.", "हर अनुरोध, बातचीत और तैयार कार्य, एक ही जगह।")}</p></header>
    <ProfileTabs artist={user.role === "artist"} active="history" hi={lang === "hi"} unread={unread} />
    <nav className="history-filters" aria-label={t("Filter your work history", "अपना कार्य इतिहास फ़िल्टर करें")}>
      {([["active", t("Open & in progress", "खुले और जारी काम")], ["all", t("All activity", "सभी गतिविधियाँ")], ["done", t("Completed", "पूर्ण")], ["unread", t("Unread", "अपठित")]] as const).map(([key, label]) => <Link key={key} href={key === "active" ? "/profile/history" : "/profile/history?view=" + key} aria-current={filter === key ? "page" : undefined}>{label}</Link>)}
    </nav>
    <div className="history-list">
      {jobs.map((job) => {
        const form = catalogue.find((item) => item.id === job.form);
        const owner = user.id === job.customer;
        const proposalState = !owner && job.proposal_status === "cancelled" ? t("Selection cancelled", "चयन रद्द") : !owner && job.artist !== user.id && job.status === "finding" ? t("Proposal sent", "प्रस्ताव भेजा") : !owner && job.artist !== user.id && job.status !== "finding" ? t("Another artist selected", "अन्य कलाकार चुना गया") : stateName(job.status, lang === "hi");
        return <article className="history-item" key={job.id}>
          <div className="history-item-top"><span>{activityDate(job.proposal_created || job.created, lang === "hi")}</span><span className={"work-state state-" + job.status}>{proposalState}</span></div>
          <div className="history-item-content"><div><p className="meta">{form?.[lang === "hi" ? "hi" : "name"] ?? job.form}{Boolean(job.sample) && <> · <Sample /></>}</p><h2><Link href={"/profile/history/" + job.id}>{job.title}</Link></h2><p>{owner ? (job.artist_name ? t("Working with ", "कलाकार: ") + job.artist_name : t("Waiting for the right artist", "उपयुक्त कलाकार की प्रतीक्षा")) : t("For ", "ग्राहक: ") + job.customer_name}</p><p>{t("Deadline", "समय-सीमा")}: {deadlineDate(job.deadline, lang === "hi")}</p></div><div className="history-item-price"><strong>{rupees(!owner && job.proposal_quote !== null ? job.proposal_quote : job.fee)}</strong><span>{!owner && job.proposal_quote !== null ? t("Your quotation", "आपका मूल्य") : job.artist ? t("Agreed fee", "तय शुल्क") : t("Proposed budget", "प्रस्तावित बजट")}</span></div></div>
          <div className="history-item-bottom"><span>{Number(job.unread) > 0 ? <span className="unread-label"><span className="unread-dot" />{job.unread} {t("new updates", "नई सूचनाएँ")}</span> : job.status === "done" ? t("Finished work accepted", "तैयार कार्य स्वीकार किया गया") : job.output ? t("Submission ready to review", "कार्य समीक्षा के लिए तैयार है") : t("Messages and project tracking", "संदेश और कार्य की प्रगति")}</span><Link href={"/profile/history/" + job.id + (owner && job.status === "finding" ? "#proposals" : "")}>{owner && job.status === "finding" ? t("Review proposals", "प्रस्ताव देखें") : t("Open project", "प्रोजेक्ट खोलें")} →</Link></div>
        </article>;
      })}
      {!jobs.length && <div className="history-empty"><span aria-hidden="true">↗</span><h2>{filter === "unread" ? t("You're all caught up", "आपने सभी सूचनाएँ देख ली हैं") : t("Your next project starts here", "आपका अगला प्रोजेक्ट यहीं से शुरू होता है")}</h2><p>{filter === "unread" ? t("New proposals, messages and project updates will appear here.", "नए प्रस्ताव, संदेश और कार्य की सूचनाएँ यहाँ दिखेंगी।") : t("Your commissions and proposals will appear here as you start working together.", "काम शुरू करते ही आपके अनुरोध और प्रस्ताव यहाँ दिखेंगे।")}</p><Link className="button" href={user.role === "customer" ? "/commissions/new" : "/commissions"}>{user.role === "customer" ? t("Post a brief", "अनुरोध पोस्ट करें") : t("Explore commissions", "कमीशन देखें")}</Link></div>}
    </div>
  </section>;
}
