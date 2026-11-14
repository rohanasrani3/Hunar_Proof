import { redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { forms, works } from "@/server/market";
import { unreadCount } from "@/server/history";
import { language } from "@/i18n/language";
import { ProfileTabs } from "@/components/profile-tabs";
import { ProfileEditor } from "@/components/profile-editor";
import { PortfolioManager } from "@/components/portfolio-manager";
import { AccountSecurity } from "@/components/account-security";
import "@/components/profile.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; onboarding?: string }> }) {
  const [user, { t, lang }, params] = await Promise.all([viewer(), language(), searchParams]);
  if (!user) redirect("/login");
  if (params.tab === "history") redirect("/profile/history");
  const tab = params.tab === "security" ? "security" : params.tab === "portfolio" && user.role === "artist" ? "portfolio" : "personal";
  const [all, portfolio, unread] = await Promise.all([tab === "portfolio" ? forms() : Promise.resolve([]), tab === "portfolio" ? works(user.id) : Promise.resolve([]), unreadCount(user.id)]);
  const { name, username, email, company, photo, role, bio, contact } = user;
  return <section className="profile-shell">
    <div className="profile-page-heading"><div><p className="meta">{t("Your space", "आपकी जगह")}</p><h1>{t("My profile", "मेरी प्रोफ़ाइल")}</h1></div><span className="profile-role">{user.role === "artist" ? t("Artist", "कलाकार") : user.role === "admin" ? t("Administrator", "प्रशासक") : t("Customer", "ग्राहक")}</span></div>
    <ProfileTabs artist={user.role === "artist"} active={tab} hi={lang === "hi"} unread={unread} />
    {tab === "personal" && <ProfileEditor user={{ name, username, email, company, photo, role, bio, contact }} links={JSON.parse(user.links) as string[]} lang={lang} />}
    {tab === "portfolio" && <PortfolioManager items={portfolio} all={all} lang={lang} onboarding={params.onboarding === "1"} />}
    {tab === "security" && <AccountSecurity lang={lang} admin={user.role === "admin"} />}
    {user.role === "admin" && <p><Link href="/admin">{t("Open moderation", "खाता प्रबंधन खोलें")} →</Link></p>}
  </section>;
}
