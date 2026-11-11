import Link from "next/link";
import { viewer } from "@/server/auth";
import { language } from "@/i18n/language";
import { switchLanguage } from "@/server/actions";
import { Logo } from "./icons";
import { ProfileMenu } from "./profile-menu";
export async function SiteHeader() {
  const [{ t, lang }, user] = await Promise.all([language(), viewer()]);
  return (
    <header className="site-header">
      <div className="shell header-grid">
        <Link className="brand" href="/">
          <Logo /> KareGhar
        </Link>
        <nav className="header-center" aria-label={t("Main navigation", "मुख्य मेनू")}>
          <Link href="/talent">{t("Find artists", "कलाकार खोजें")}</Link>
          <Link href="/commissions">{t("Commission work", "कमीशन कार्य")}</Link>
          <Link href="/impact">{t("Impact", "प्रभाव")}</Link>
        </nav>
        <div className="header-actions">
          {user ? (
            <ProfileMenu admin={user.role === "admin"} labels={{
              profile: t("My profile", "मेरी प्रोफ़ाइल"),
              view: t("View my profile", "मेरी प्रोफ़ाइल देखें"),
              edit: t("Edit my profile", "मेरी प्रोफ़ाइल संपादित करें"),
              moderation: t("Moderation", "खाता प्रबंधन"),
              logout: t("Log out", "लॉग आउट"),
            }} />
          ) : (
            <Link href="/login">{t("Log in / Sign up", "लॉग इन / साइन अप")}</Link>
          )}
          <form action={switchLanguage}>
            <input
              type="hidden"
              name="lang"
              value={lang === "hi" ? "en" : "hi"}
            />
            <button className="pill" lang={lang === "hi" ? "en" : "hi"}>
              {lang === "hi" ? "English" : "हिन्दी"}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
