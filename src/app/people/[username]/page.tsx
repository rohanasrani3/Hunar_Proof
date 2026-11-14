import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { publicProfile, works, publishedWorks, forms } from "@/server/market";
import { viewer } from "@/server/auth";
import { language } from "@/i18n/language";
import { Sample } from "@/components/discovery";
import { SocialLinks } from "@/components/social-links";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import "@/components/profile.css";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [p, user, { t, lang }] = await Promise.all([publicProfile(username), viewer(), language()]);
  if (user?.username === username) redirect("/profile");
  if (!p) notFound();
  const [items, finished, all] = await Promise.all([p.role === "artist" ? works(p.id) : Promise.resolve([]), p.role === "artist" ? publishedWorks(p.id) : Promise.resolve([]), forms()]);
  return <section className="public-profile">
    <Link className="back-link" href={p.role === "artist" ? "/talent" : "/commissions"}>← {p.role === "artist" ? t("All artists", "सभी कलाकार") : t("Explore commissions", "कमीशन देखें")}</Link>
    <header className="public-profile-heading"><div className="profile-intro">
      {p.photo ? <Image width={112} height={112} unoptimized className="profile-avatar" alt="" src={"/api/media/" + p.photo} /> : <span className="profile-avatar-placeholder" aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>}
      <div><p className="meta">{p.role === "artist" ? t("Artist", "कलाकार") : t("Customer", "ग्राहक")} {Boolean(p.sample) && <Sample />}</p><h1>{p.name}</h1>{p.company && <p>{p.company}</p>}<SocialLinks links={JSON.parse(p.links) as string[]} /></div>
    </div><aside className="profile-contact"><span className="meta">{t("Get in touch", "संपर्क करें")}</span>{p.contact ? <p className="pre">{p.contact}</p> : <p>{t("Contact details haven’t been shared yet.", "अभी संपर्क जानकारी साझा नहीं की गई है।")}</p>}<small>{t("Discuss the brief, price and timeline before starting work.", "काम शुरू करने से पहले विवरण, शुल्क और समय-सीमा पर बात करें।")}</small></aside></header>
    {p.role === "artist" && <section className="public-portfolio" aria-labelledby="public-portfolio-title"><div className="section-heading"><div><p className="meta">{t("A selection of work", "कुछ चुनिंदा कलाकृतियाँ")}</p><h2 id="public-portfolio-title">{t("Portfolio", "पोर्टफ़ोलियो")}</h2></div></div><PortfolioGallery hi={lang === "hi"} items={items.map((item) => ({ ...item, formLabel: all.find((form) => form.id === item.form)?.[lang === "hi" ? "hi" : "name"] ?? item.form }))} />{!items.length && <div className="profile-empty-note"><p>{t("This artist is preparing their portfolio. Check back soon.", "यह कलाकार अपना पोर्टफ़ोलियो तैयार कर रहा है। कुछ समय बाद फिर देखें।")}</p></div>}</section>}
    <section className="public-about"><p className="meta">{p.role === "artist" ? t("Behind the work", "कला के पीछे") : t("A little introduction", "एक छोटा परिचय")}</p><h2>{t("About me", "मेरे बारे में")}</h2><p className="pre">{p.bio || t("No introduction added yet.", "अभी परिचय नहीं जोड़ा गया है।")}</p></section>
    {p.role === "artist" && finished.length > 0 && <section className="public-finished" aria-labelledby="finished-title"><div className="section-heading"><div><p className="meta">{t("Made on KareGhar", "KareGhar पर बनाया गया")}</p><h2 id="finished-title">{t("Finished commissions", "पूर्ण कमीशन")}</h2><p>{t("Submitted by the artist, accepted and shared by the customer.", "कलाकार द्वारा प्रस्तुत, ग्राहक द्वारा स्वीकार और साझा किए गए कार्य।")}</p></div></div><PortfolioGallery hi={lang === "hi"} defaultView="grid" items={finished.filter((item) => item.output).map((item) => ({ id: item.id, title: item.title, url: item.output.startsWith("/seed/") ? item.output : "/api/media/" + item.output, formLabel: t("Completed commission", "पूर्ण कमीशन") }))} /></section>}
  </section>;
}
