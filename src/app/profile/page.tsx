import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { forms, works } from "@/server/market";
import { query } from "@/server/db";
import { updateProfile, addWork, changePassword } from "@/server/actions";
import { ActionForm } from "@/components/action-form";
import { language } from "@/i18n/language";
import { CATEGORIES } from "@/contract/artForms";
import { SOCIALS, SocialIcon, SocialLinks, socialKey } from "@/components/social-links";
import { PortfolioGallery } from "@/components/portfolio-gallery";
export default async function Page() {
  const user = await viewer();
  if (!user) redirect("/login");
  const [{ t, lang }, all, jobs, portfolio] = await Promise.all([
    language(),
    forms(),
    query<{ id: string; title: string }>(
      "SELECT id,title FROM commissions WHERE customer=$1 OR artist=$1 OR id IN (SELECT commission FROM proposals WHERE artist=$1) ORDER BY created DESC",
      [user.id],
    ),
    user.role === "artist" ? works(user.id) : Promise.resolve([]),
  ]);
  const links = JSON.parse(user.links) as string[];
  return (
    <section className="narrow">
      <div className="profile-intro">
        {user.photo ? (
          <Image width={112} height={112} unoptimized className="profile-avatar" src={"/api/media/" + user.photo} alt={t("Profile photo", "प्रोफ़ाइल फ़ोटो")} />
        ) : <span className="profile-avatar-placeholder" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>}
        <div><p className="meta">{user.role === "artist" ? t("Artist", "कलाकार") : user.role === "admin" ? t("Admin", "प्रशासक") : t("Customer", "ग्राहक")}</p><h1>{user.name}</h1></div>
      </div>
      {user.role === "admin" ? (
        <Link href="/admin">{t("Moderation", "खाता प्रबंधन")}</Link>
      ) : (
        <Link href={"/people/" + user.username}>
          {t("View public profile", "सार्वजनिक प्रोफ़ाइल देखें")}
        </Link>
      )}
      {user.role === "artist" && portfolio.length > 0 && <><h2>{t("My portfolio", "मेरा पोर्टफ़ोलियो")}</h2><PortfolioGallery hi={lang === "hi"} items={portfolio.map((item) => ({ ...item, formLabel: all.find((form) => form.id === item.form)?.[lang === "hi" ? "hi" : "name"] ?? item.form }))} /></>}
      <SocialLinks links={links} />
      <h2 id="edit-profile">{t("Edit my profile", "मेरी प्रोफ़ाइल संपादित करें")}</h2>
      <ActionForm
        action={updateProfile}
        lang={lang}
        label={t("Save profile", "प्रोफ़ाइल सहेजें")}
      >
        <label>
          {t("Name", "नाम")}
          <input name="name" defaultValue={user.name} required />
        </label>
        <label>
          {t("Email", "ईमेल")}
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            required={user.role !== "admin"}
          />
        </label>
        <label>
          {t("Company (optional)", "कंपनी (वैकल्पिक)")}
          <input name="company" defaultValue={user.company} />
        </label>
        <fieldset className="social-fields">
          <legend>{t("Social links", "सोशल लिंक")}</legend>
          {SOCIALS.map((site) => <label key={site.key}>
            <span className="social-field-label"><SocialIcon name={site.key} /> {site.label}</span>
            <input name={"social_" + site.key} type="url" placeholder={"https://" + site.hosts[0] + "/"} defaultValue={links.find((link) => socialKey(link) === site.key) ?? ""} />
          </label>)}
          <input type="hidden" name="linksExtra" value={JSON.stringify(links.filter((link) => !socialKey(link)))} />
        </fieldset>
        <label>
          {t(
            "Profile photo (JPG, PNG or WebP, up to 5 MB)",
            "प्रोफ़ाइल फ़ोटो (JPG, PNG या WebP, अधिकतम 5 MB)",
          )}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
      </ActionForm>
      <h2>{t("My commissions", "मेरे कमीशन")}</h2>
      {jobs.map((c) => (
        <p key={c.id}>
          <Link href={"/commissions/" + c.id}>{c.title}</Link>
        </p>
      ))}
      {!jobs.length && (
        <Link href="/commissions">
          {t("Explore commissions", "कमीशन देखें")}
        </Link>
      )}
      {user.role === "artist" && (
        <>
          <h2>{t("Add portfolio work", "पोर्टफ़ोलियो में कार्य जोड़ें")}</h2>
          <ActionForm
            action={addWork}
            lang={lang}
            label={t("Add work", "कार्य जोड़ें")}
          >
            <label>
              {t("Work title", "कार्य का शीर्षक")}
              <input name="title" required maxLength={120} />
            </label>
            <label>
              {t("Link to your work", "अपने कार्य का लिंक")}
              <input name="url" type="url" required />
            </label>
            <label>
              {t("Art category", "कला श्रेणी")}
              <select name="category">
                {Object.entries(CATEGORIES).map(([id, v]) => (
                  <option key={id} value={id}>
                    {v[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t(
                "Art form (choose or enter a new name)",
                "कला विधा (चुनें या नया नाम लिखें)",
              )}
              <input
                name="formName"
                list="formNames"
                required
                maxLength={120}
              />
            </label>
            <datalist id="formNames">
              {all.map((f) => (
                <option key={f.id} value={f.name}>
                  {lang === "hi" ? f.hi : f.name}
                </option>
              ))}
            </datalist>
          </ActionForm>
        </>
      )}
      <h2>{t("Change password", "पासवर्ड बदलें")}</h2>
      <ActionForm
        action={changePassword}
        lang={lang}
        label={t("Change password", "पासवर्ड बदलें")}
      >
        <label>
          {t("Current password", "वर्तमान पासवर्ड")}
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          {t(
            "New password (at least 6 characters)",
            "नया पासवर्ड (कम से कम 6 अक्षर)",
          )}
          <input
            name="password"
            type="password"
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
      </ActionForm>
    </section>
  );
}
