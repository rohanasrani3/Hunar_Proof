import Link from "next/link";
import { language } from "@/i18n/language";
import { moderationAccounts, moderationHistory } from "@/server/moderation";
export default async function Page() {
  const [{ t, lang }, accounts, history] = await Promise.all([
    language(),
    moderationAccounts(),
    moderationHistory(),
  ]);
  return (
    <>
      <h1>{t("Account moderation", "खाता प्रबंधन")}</h1>
      <div className="cards">
        {accounts.map((a) => (
          <article className="card" key={a.id}>
            <h2>
              <Link href={"/admin/" + a.id}>{a.name}</Link>
            </h2>
            <p>
              @{a.username} ·{" "}
              {a.role === "admin"
                ? t("Admin", "प्रशासक")
                : a.role === "artist"
                  ? t("Artist", "कलाकार")
                  : t("Customer", "ग्राहक")}
            </p>
            <p>
              {a.suspended ? t("Suspended", "निलंबित") : t("Active", "सक्रिय")}{" "}
              · {t("Open commissions", "खुले कमीशन")} {a.active}
            </p>
          </article>
        ))}
      </div>
      <h2>{t("Moderation history", "प्रबंधन इतिहास")}</h2>
      {!history.length && (
        <p>
          {t("No account actions yet.", "अभी तक कोई कार्रवाई नहीं हुई है।")}
        </p>
      )}
      {history.map((h) => (
        <article key={h.sequence} className="card">
          <strong>
            @{h.target} ·{" "}
            {h.suspended ? t("Suspended", "निलंबित") : t("Restored", "बहाल")}
          </strong>
          <p>{h.reason}</p>
          <small>
            @{h.actor} ·{" "}
            {new Date(Number(h.created)).toLocaleString(
              lang === "hi" ? "hi-IN" : "en-IN",
              { timeZone: "UTC" },
            )}{" "}
            UTC
          </small>
        </article>
      ))}
    </>
  );
}
