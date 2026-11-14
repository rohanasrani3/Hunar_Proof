import Link from "next/link";
import { language } from "@/i18n/language";
import { query } from "@/server/db";
import { stateName } from "@/components/discovery";

type Stats = {
  posted: number;
  done: number;
  artists: number;
  customers: number;
  fees: number;
  finding: number;
  progress: number;
  samples: number;
};
export default async function Page() {
  const [{ t, lang }, [s]] = await Promise.all([
    language(),
    query<Stats>(`SELECT COUNT(*) AS posted,
    COUNT(CASE WHEN status='done' AND output<>'' THEN 1 END) AS done,
    COUNT(DISTINCT CASE WHEN status='done' AND output<>'' THEN artist END) AS artists,
    COUNT(DISTINCT customer) AS customers, COALESCE(SUM(CASE WHEN status='done' AND output<>'' THEN fee ELSE 0 END),0) AS fees,
    COUNT(CASE WHEN sample=1 THEN 1 END) AS samples,
    COUNT(CASE WHEN status='finding' THEN 1 END) AS finding, COUNT(CASE WHEN status='progress' THEN 1 END) AS progress
    FROM commissions`),
  ]);
  const money = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
  const completion = Number(s.posted)
    ? Math.round((100 * s.done) / s.posted)
    : 0;
  const totals = [
    [
      t("Accepted work value", "स्वीकृत कार्य का मूल्य"),
      money(s.fees),
      t(
        "The agreed fees for work customers have accepted. Payments take place directly between the customer and artist.",
        "ग्राहकों द्वारा स्वीकार किए गए कार्य का तय शुल्क। ग्राहक सीधे कलाकार को भुगतान करते हैं।",
      ),
    ],
    [
      t("Commissions completed", "पूर्ण कमीशन"),
      s.done,
      t(
        "A commission counts once finished work is submitted and the customer accepts it.",
        "तैयार कार्य जमा होने और ग्राहक द्वारा स्वीकार किए जाने पर कमीशन गिना जाता है।",
      ),
    ],
    [
      t("Artists with accepted work", "स्वीकृत कार्य वाले कलाकार"),
      s.artists,
      t(
        "Each artist with at least one accepted commission counts once, even if the output is private.",
        "कम से कम एक स्वीकृत कमीशन वाले हर कलाकार को एक बार गिना जाता है, भले ही कार्य निजी हो।",
      ),
    ],
    [
      t("Customers served", "सेवा प्राप्त ग्राहक"),
      s.customers,
      t(
        "Each customer who has posted a commission counts once.",
        "कमीशन पोस्ट करने वाले हर ग्राहक को एक बार गिना जाता है।",
      ),
    ],
  ] as const;
  return (
    <>
      <p className="eyebrow">{t("The work, in numbers", "काम, आँकड़ों में")}</p>
      <h1>
        {t("What the pilot has done so far", "पायलट की अब तक की उपलब्धियाँ")}
      </h1>
      <p className="page-lead">
        {t(
          "A shared picture of the briefs, collaborations, and finished work in our community.",
          "हमारे समुदाय के अनुरोधों, सहयोग और तैयार कार्यों की एक साझा तस्वीर।",
        )}
      </p>
      {Number(s.samples) > 0 && <aside className="pilot-note"><span className="sample">{t("Pilot · Sample data included", "पायलट · नमूना डेटा शामिल")}</span><p>{t("These totals include fictional examples to show how KareGhar works. Sample fees illustrate commission value; they are not real earnings or verified payments.", "इन आँकड़ों में KareGhar को समझाने के लिए काल्पनिक उदाहरण शामिल हैं। नमूना शुल्क कमीशन का मूल्य दिखाते हैं; वे वास्तविक आय या सत्यापित भुगतान नहीं हैं।")}</p></aside>}
      <dl className="impact-totals">
        {totals.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="impact-panels">
        <section className="card">
          <h2>{t("Pipeline", "कमीशन की स्थिति")}</h2>
          <dl>
            {[
              [t("Commissions posted", "पोस्ट किए गए कमीशन"), s.posted],
              ...(["finding", "progress", "done"] as const).map((k) => [
                stateName(k, lang === "hi"),
                s[k],
              ]),
              [
                t(
                  "Average fee per completed commission",
                  "प्रति पूर्ण कमीशन औसत शुल्क",
                ),
                Number(s.done) ? money(Math.round(s.fees / s.done)) : "—",
              ],
            ].map(([label, value]) => (
              <div className="impact-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="impact-row">
            <span>
              {t("Completion rate", "पूर्णता दर")}
            </span>
            <span>{completion}%</span>
          </div>
        </section>
        <section className="card">
          <h2>{t("How we count", "गणना की विधि")}</h2>
          <dl>
            {totals.map(([label, , explanation]) => (
              <div key={label}>
                <dt>
                  <strong>{label}</strong>
                </dt>
                <dd>{explanation}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <Link className="button" href="/talent">
        {t("Meet the artists", "कलाकारों से मिलें")}
      </Link>
    </>
  );
}
