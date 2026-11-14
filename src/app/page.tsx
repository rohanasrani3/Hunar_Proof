import Image from "next/image";
import Link from "next/link";
import { language } from "@/i18n/language";
import { CATEGORIES } from "@/contract/artForms";
export default async function Home() {
  const { t, lang } = await language();
  return (
    <>
    <section className="hero">
      <div>
        <p className="eyebrow">{t("Indian craft. New possibilities.", "भारतीय कला। नई संभावनाएँ।")}</p>
        <h1>
          {t(
            "Empowering artisans. Enabling businesses",
            "कारीगरों को सशक्त बनाना। व्यवसायों को सक्षम बनाना",
          )}
        </h1>
        <p>
          {t(
            "Find an artist for your next project, or explore briefs from customers looking for your craft.",
            "अपने अगले प्रोजेक्ट के लिए कलाकार खोजें या अपनी कला से जुड़े ग्राहकों के अनुरोध देखें।",
          )}
        </p>
        <div className="actions">
          <Link className="button" href="/talent">
            {t("Find an artist", "कलाकार खोजें")}
          </Link>
          <Link className="pill" href="/commissions">
            {t("Browse commissions", "कमीशन देखें")}
          </Link>
        </div>
      </div>
      <figure>
        <Image
          width={1200}
          height={750}
          priority
          src="/seed/warli-final.svg"
          alt={t("Warli artwork", "वारली चित्रकला")}
        />
        <figcaption>
          <span>{t("Warli · Maharashtra", "वारली · महाराष्ट्र")}</span><span className="sample">{t("Sample artwork", "नमूना कलाकृति")}</span>
        </figcaption>
      </figure>
    </section>
    <nav className="home-categories" aria-label={t("Explore art categories", "कला श्रेणियाँ देखें")}><span>{t("Explore a craft", "कला खोजें")}</span>{Object.entries(CATEGORIES).map(([id, category]) => <Link key={id} href={`/talent?category=${id}`}>{category[lang]} <span aria-hidden="true">↗</span></Link>)}</nav>
    <section className="how-it-works">
      <p className="eyebrow">{t("From a conversation to a creation", "बातचीत से कलाकृति तक")}</p>
      <h2>{t("A little clarity. Better work.", "स्पष्ट बातचीत। बेहतर काम।")}</h2>
      <div className="process-grid">
        <article><span>01</span><h3>{t("Find the right fit", "सही साथी खोजें")}</h3><p>{t("Explore portfolios or post a brief with your budget, references, and the kind of work you need.", "पोर्टफ़ोलियो देखें या बजट, संदर्भ और ज़रूरी काम का विवरण देकर अनुरोध पोस्ट करें।")}</p></article>
        <article><span>02</span><h3>{t("Talk before you start", "शुरू करने से पहले बात करें")}</h3><p>{t("Exchange a private proposal. Use messages to agree on the scope, price, timing, and payment before choosing an artist.", "निजी प्रस्ताव साझा करें। कलाकार चुनने से पहले संदेशों में काम, शुल्क, समय और भुगतान तय करें।")}</p></article>
        <article><span>03</span><h3>{t("Make it, then share it", "बनाएँ, फिर साझा करें")}</h3><p>{t("Follow the work in Work history. Artists submit their finished piece; customers review, accept, and choose whether to publish it.", "कार्य इतिहास में काम की प्रगति देखें। कलाकार तैयार काम जमा करते हैं; ग्राहक समीक्षा, स्वीकृति और प्रकाशन तय करते हैं।")}</p></article>
      </div>
    </section>
    </>
  );
}
