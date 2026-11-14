import { DirectoryTile } from "@/components/directory-tile";
import Link from "next/link";
import { forms, commissions } from "@/server/market";
import { viewer } from "@/server/auth";
import { language } from "@/i18n/language";
import { Filters, Sample, stateName } from "@/components/discovery";
import { sampleCover } from "@/lib/sample-media";
import { deadlineDate } from "@/lib/commission-display";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; form?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [{ lang, t }, all, user] = await Promise.all([
    language(),
    forms(),
    viewer(),
  ]);
  const selectedParams = { ...params, status: params.status ?? "finding" };
  const items = await commissions(selectedParams, "", user?.id);
  return (
    <>
      <div className="page-heading">
        <div><p className="eyebrow">{t("The commission board", "कमीशन बोर्ड")}</p>
        <h1>{t("Good work starts here.", "अच्छे काम की शुरुआत यहाँ।")}</h1>
        <p className="page-lead">{t("Find a brief that speaks to your craft, or discover what artists and customers have made together.", "अपनी कला के लिए सही अनुरोध खोजें या कलाकारों और ग्राहकों के मिलकर बनाए काम देखें।")}</p></div>
        {(!user || user.role === "customer") && (
          <Link className="button" href={user ? "/commissions/new" : "/login"}>
            {t("Post a commission", "कमीशन पोस्ट करें")}
          </Link>
        )}
      </div>
      <Filters all={all} params={selectedParams} status />
      <div className="results-bar"><p>{items.length} {t("commissions", "कमीशन")}</p>{user && <Link href="/profile/history">{t("Your applications & work", "आपके प्रस्ताव और काम")} <span aria-hidden="true">↗</span></Link>}</div>
      <div className="directory-grid">
        {items.map((c) => {
          const form = all.find((f) => f.id === c.form);
          return (
            <DirectoryTile
              key={c.id}
              href={"/commissions/" + c.id}
              title={c.title}
              cover={
                c.output && /\.(png|jpg|webp)$/i.test(c.output)
                  ? c.output.startsWith("/seed/") ? c.output : "/api/media/" + c.output
                  : c.sample
                    ? sampleCover(c.form)
                    : c.reference ? "/api/media/" + c.reference : undefined
              }
              formLabel={form?.[lang === "hi" ? "hi" : "name"] ?? c.form}
              action={t("View commission", "कमीशन देखें")}
              footer={
                <>
                  <span className="commission-price">₹
                    {Number(c.fee).toLocaleString("en-IN")}
                  </span>
                  <span className={`status-label status-${c.status}`}>{stateName(c.status, lang === "hi")}</span>
                </>
              }
            >
              <p className="tile-description">{c.brief}</p>
              <small>
                <Link href={"/people/" + c.customer_username}>
                  {c.customer_name}
                </Link>{" "}
                · {form?.[lang === "hi" ? "hi" : "name"]}
              </small>
              {c.customer_contact && <small className="contact-inline">{t("Contact", "संपर्क")}: {c.customer_contact}</small>}
              <small>{t("Deadline", "समय-सीमा")}: {deadlineDate(c.deadline, lang === "hi")}</small>
              {Boolean(c.sample) && <div><Sample /></div>}
            </DirectoryTile>
          );
        })}
      </div>
      {!items.length && (
        <div className="empty-state"><h2>{t("A fresh start for your search.", "अपनी खोज को नई शुरुआत दें।")}</h2><p>{t("No commissions match these filters. Try another category or view all open briefs.", "इन फ़िल्टर से कोई कमीशन नहीं मिला। दूसरी श्रेणी चुनें या सभी खुले अनुरोध देखें।")}</p><Link className="pill" href="/commissions">{t("Clear filters", "फ़िल्टर हटाएँ")}</Link></div>
      )}
    </>
  );
}
