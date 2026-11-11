import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { publicProfile, works, publishedWorks, forms } from "@/server/market";
import { language } from "@/i18n/language";
import { Sample } from "@/components/discovery";
import { SocialLinks } from "@/components/social-links";
import { PortfolioGallery } from "@/components/portfolio-gallery";
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const p = await publicProfile((await params).username);
  if (!p) notFound();
  const [{ t, lang }, items, finished, all] = await Promise.all([
    language(),
    works(p.id),
    publishedWorks(p.id),
    forms(),
  ]);
  return (
    <section>
      <Link href="/talent">← {t("Find artists", "कलाकार खोजें")}</Link>
      <p className="meta">
        {p.role === "artist" ? t("Artist", "कलाकार") : t("Customer", "ग्राहक")}{" "}
        {Boolean(p.sample) && <Sample />}
      </p>
      <div className="profile-intro">
        {p.photo ? <Image width={112} height={112} unoptimized className="profile-avatar" alt={t("Profile photo", "प्रोफ़ाइल फ़ोटो")} src={"/api/media/" + p.photo} /> : <span className="profile-avatar-placeholder" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
        <h1>{p.name}</h1>
      </div>
      {p.company && <p>{p.company}</p>}
      <SocialLinks links={JSON.parse(p.links) as string[]} />
      {p.role === "artist" && (
        <>
          <h2>{t("Portfolio", "पोर्टफ़ोलियो")}</h2>
          <PortfolioGallery hi={lang === "hi"} items={items.map((item) => ({ ...item, formLabel: all.find((form) => form.id === item.form)?.[lang === "hi" ? "hi" : "name"] ?? item.form }))} />
          {!items.length && (
            <p>
              {t(
                "No portfolio work yet.",
                "अभी पोर्टफ़ोलियो में कार्य नहीं है।",
              )}
            </p>
          )}
          {finished.length > 0 && (
            <>
              <h2>{t("Published commissions", "प्रकाशित कमीशन")}</h2>
              {finished.map((c) => (
                <p key={c.id}>
                  <Link href={"/commissions/" + c.id}>{c.title}</Link>
                </p>
              ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
