import Link from "next/link";
import { language } from "@/i18n/language";
import { requireAdmin, moderationDashboard } from "@/server/moderation";
import { moderateAccount } from "@/server/moderation-action";
import { ActionForm } from "@/components/action-form";
import { stateName } from "@/components/discovery";
import { works } from "@/server/market";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [admin, { t, lang }, { person, jobs }] = await Promise.all([
    requireAdmin(),
    language(),
    moderationDashboard(id),
  ]);
  const portfolio = person.role === "artist" ? await works(id) : [];
  return (
    <section className="narrow">
      <Link href="/admin">← {t("Account moderation", "खाता प्रबंधन")}</Link>
      <h1>{person.name}</h1>
      <p>
        @{person.username} ·{" "}
        {person.suspended ? t("Suspended", "निलंबित") : t("Active", "सक्रिय")}
      </p>
      {person.company && <p>{person.company}</p>}
      {(JSON.parse(person.links) as string[]).map((link, i) => (
        <p key={i}>
          <a href={link}>{link}</a>
        </p>
      ))}
      {portfolio.length > 0 && (
        <>
          <h2>{t("Portfolio", "पोर्टफ़ोलियो")}</h2>
          {portfolio.map((w) => (
            <p key={w.id}>
              <a href={w.url}>{w.title}</a>
            </p>
          ))}
        </>
      )}
      <h2>{t("Commission history", "कमीशन इतिहास")}</h2>
      {!jobs.length && <p>{t("No commissions.", "कोई कमीशन नहीं है।")}</p>}
      {jobs.map((c) => (
        <p key={c.id}>
          <Link href={"/commissions/" + c.id}>{c.title}</Link> ·{" "}
          {stateName(c.status, lang === "hi")}
          {c.paused ? " · " + t("Paused", "रुका हुआ") : ""}
        </p>
      ))}
      {admin.id !== id && !person.sample && (
        <>
          <h2>
            {person.suspended
              ? t("Restore account", "खाता बहाल करें")
              : t("Suspend account", "खाता निलंबित करें")}
          </h2>
          <p>
            {person.suspended
              ? t(
                  "Restoring allows a fresh login and resumes eligible commissions.",
                  "बहाली के बाद सदस्य फिर लॉग इन कर सकता है और पात्र कमीशन जारी रहेंगे।",
                )
              : t(
                  "Suspension signs this user out, hides their listings and pauses actions on their commissions.",
                  "निलंबन से सदस्य लॉग आउट होगा, उसकी लिस्टिंग छिपेंगी और कमीशन पर कार्रवाई रुकेगी।",
                )}
          </p>
          <ActionForm
            key={person.suspended}
            lang={lang}
            action={moderateAccount}
            label={
              person.suspended
                ? t("Restore account", "खाता बहाल करें")
                : t("Suspend account", "खाता निलंबित करें")
            }
          >
            <input
              type="hidden"
              name="version"
              value={person.session_version}
            />
            <input type="hidden" name="target" value={id} />
            <input
              type="hidden"
              name="action"
              value={person.suspended ? "restore" : "suspend"}
            />
            <label>
              {t("Reason for the audit log", "इतिहास में दर्ज करने का कारण")}
              <textarea required maxLength={4000} name="reason" />
            </label>
            <label>
              <input type="checkbox" name="confirm" required />{" "}
              {t(
                "I confirm this account action.",
                "मैं इस खाते पर कार्रवाई की पुष्टि करता हूँ।",
              )}
            </label>
          </ActionForm>
        </>
      )}
    </section>
  );
}
