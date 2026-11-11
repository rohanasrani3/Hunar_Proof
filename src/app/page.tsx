import Image from "next/image";
import Link from "next/link";
import { language } from "@/i18n/language";
export default async function Home() {
  const { t } = await language();
  return (
    <section className="hero">
      <div>
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
          {t("Warli · Sample artwork", "वारली · नमूना कलाकृति")}
        </figcaption>
      </figure>
    </section>
  );
}
