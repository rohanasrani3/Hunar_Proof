import { DirectoryTile } from "@/components/directory-tile";
import { artists, forms } from "@/server/market";
import { Filters, Sample } from "@/components/discovery";
import { language } from "@/i18n/language";
import { viewer } from "@/server/auth";
import Link from "next/link";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; form?: string }>;
}) {
  const params = await searchParams;
  const [all, people, { t, lang }, user] = await Promise.all([
    forms(),
    artists(params),
    language(),
    viewer(),
  ]);
  let last = -1,
    rank = 0;
  const ranked = people.map((person, i) => {
    const count = Number(person.completed);
    if (count !== last) { rank = i + 1; last = count; }
    return { ...person, rank: count ? rank : 0 };
  }).filter((person) => person.id !== user?.id);
  const categoryName = all.find((form) => form.id === params.form)?.[lang === "hi" ? "hi" : "name"];
  return (
    <>
      <div className="page-heading"><div>
      <p className="eyebrow">{t("The artist directory", "कलाकार निर्देशिका")}</p>
      <h1>{t("Find your kind of craft.", "अपनी पसंद की कला खोजें।")}</h1>
      <p className="page-lead">
        {t(
          "Meet the people behind the work. Explore their portfolios, get in touch, and make something together.",
          "कलाकृतियों के पीछे के कलाकारों से मिलें। पोर्टफ़ोलियो देखें, संपर्क करें और साथ मिलकर कुछ बनाएँ।",
        )}
      </p>
      </div></div>
      <Filters all={all} params={params} />
      <div className="results-bar"><p>{ranked.length} {t("artists", "कलाकार")}{categoryName ? ` · ${categoryName}` : ""}</p><p>{t("Ranked by accepted finished work", "स्वीकृत तैयार कार्य के अनुसार रैंकिंग")}</p></div>
      <div className="directory-grid">
        {ranked.map((p) => {
          const count = Number(p.completed);
          const names = (p.form_ids ?? "")
            .split(",")
            .map(
              (id) =>
                all.find((f) => f.id === id)?.[lang === "hi" ? "hi" : "name"],
            )
            .filter(Boolean)
            .join(" · ");
          return (
            <DirectoryTile
              key={p.id}
              href={"/people/" + p.username}
              title={p.name}
              cover={
                p.cover_url || (p.photo ? "/api/media/" + p.photo : undefined)
              }
              formLabel={names || p.name}
              action={t("View portfolio", "पोर्टफ़ोलियो देखें")}
              footer={
                  <>
                    <span>
                      {count} {t(count === 1 ? "finished work" : "finished works", "तैयार कार्य")}
                    </span>
                    {count > 0 && (
                      <span className="rank-label">
                        {t("Rank", "स्थान")} #{p.rank}
                      </span>
                    )}
                  </>
              }
            >
              {names && <p className="tile-description">{names}</p>}
              {p.company && <small>{p.company}</small>}
              {p.contact && <small className="contact-inline">{t("Contact", "संपर्क")}: {p.contact}</small>}
              {Boolean(p.sample) && <div><Sample /></div>}
            </DirectoryTile>
          );
        })}
      </div>
      {!ranked.length && (
        <div className="empty-state"><h2>{t("No artists here just yet.", "अभी यहाँ कोई कलाकार नहीं है।")}</h2><p>{t("Try a different art form or explore the full directory.", "दूसरी कला विधा चुनें या पूरी निर्देशिका देखें।")}</p><Link className="pill" href="/talent">{t("Clear filters", "फ़िल्टर हटाएँ")}</Link></div>
      )}
    </>
  );
}
