import { DirectoryTile } from "@/components/directory-tile";
import { artists, forms } from "@/server/market";
import { Filters, Sample } from "@/components/discovery";
import { language } from "@/i18n/language";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; form?: string }>;
}) {
  const params = await searchParams;
  const [all, people, { t, lang }] = await Promise.all([
    forms(),
    artists(params),
    language(),
  ]);
  let last = -1,
    rank = 0;
  return (
    <>
      <h1>{t("Find artists", "कलाकार खोजें")}</h1>
      <p>
        {t(
          "Ranked by completed commissions. Choose an art form to see its leading artists.",
          "पूर्ण कमीशन के आधार पर रैंकिंग। किसी विधा के अग्रणी कलाकार देखने के लिए उसे चुनें।",
        )}
      </p>
      <Filters all={all} params={params} />
      <div className="directory-grid">
        {people.map((p, i) => {
          const count = Number(p.completed);
          if (count !== last) {
            rank = i + 1;
            last = count;
          }
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
                p.sample ? (
                  <Sample />
                ) : (
                  <>
                    <span>
                      {t("Completed commissions", "पूर्ण कमीशन")} · {count}
                    </span>
                    {count > 0 && (
                      <span>
                        {t("Rank", "स्थान")} {rank}
                      </span>
                    )}
                  </>
                )
              }
            >
              {names && <p>{names}</p>}
              {p.company && <small>{p.company}</small>}
            </DirectoryTile>
          );
        })}
      </div>
      {!people.length && (
        <p>
          {t(
            "No artists match these filters.",
            "इन फ़िल्टर से कोई कलाकार नहीं मिला।",
          )}
        </p>
      )}
    </>
  );
}
