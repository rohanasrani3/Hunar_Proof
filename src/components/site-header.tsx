import Link from "next/link";
import { viewer } from "@/server/auth";
import { language } from "@/i18n/language";
import { switchLanguage } from "@/server/actions";
import { Logo } from "./icons";
import { ProfileMenu } from "./profile-menu";
import { unreadCount } from "@/server/history";
import { MainNavigation } from "./main-navigation";
export async function SiteHeader() {
  const [{ t, lang }, user] = await Promise.all([language(), viewer()]);
  const unread = user ? await unreadCount(user.id) : 0;
  return (
    <header className="site-header">
      <div className="shell header-grid">
        <Link className="brand" href="/">
          <Logo /> KareGhar
        </Link>
        <MainNavigation hi={lang === "hi"} />
        <div className="header-actions">
          {user ? (
            <ProfileMenu admin={user.role === "admin"} artist={user.role === "artist"} unread={unread} labels={{
              profile: t("My profile", "मेरी प्रोफ़ाइल"),
              portfolio: t("My portfolio", "मेरा पोर्टफ़ोलियो"),
              history: t("Work history", "कार्य इतिहास"),
              security: t("Security", "सुरक्षा"),
              moderation: t("Moderation", "खाता प्रबंधन"),
              logout: t("Log out", "लॉग आउट"),
            }} />
          ) : (
            <Link className="header-login" href="/login">{t("Log in", "लॉग इन")}</Link>
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
