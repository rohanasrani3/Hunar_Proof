import { language } from "@/i18n/language";
import { register } from "@/server/actions";
import { ActionForm } from "@/components/action-form";
import Link from "next/link";
export default async function Page() {
  const { t, lang } = await language();
  return (
    <section className="auth-page">
      <p className="eyebrow">{t("Make something together", "साथ मिलकर कुछ बनाएँ")}</p>
      <h1>{t("Create an account", "खाता बनाएँ")}</h1>
      <p>{t("Find your next collaborator. Artists can set up their portfolio after signing in.", "अपना अगला सहयोगी खोजें। कलाकार लॉग इन करने के बाद पोर्टफ़ोलियो बना सकते हैं।")}</p>
      <ActionForm
        action={register}
        label={t("Create account", "खाता बनाएँ")}
        lang={lang}
      >
        <label>
          {t("Account type", "खाते का प्रकार")}
          <select name="role">
            <option value="customer">{t("Customer", "ग्राहक")}</option>
            <option value="artist">{t("Artist", "कलाकार")}</option>
          </select>
        </label>
        <label>
          {t("Name", "नाम")}
          <input name="name" autoComplete="name" maxLength={120} required />
        </label>
        <label>
          {t("Email", "ईमेल")}
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          {t(
            "Username (3–40 case-sensitive letters, digits or underscores)",
            "उपयोगकर्ता नाम (3–40 बड़े या छोटे अंग्रेज़ी अक्षर, अंक या अंडरस्कोर)",
          )}
          <input
            name="username"
            autoComplete="username"
            pattern="[A-Za-z0-9_]{3,40}"
            required
          />
        </label>
        <label>
          {t(
            "Password (at least 6 characters)",
            "पासवर्ड (कम से कम 6 अक्षर)",
          )}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            maxLength={128}
            required
          />
        </label>
      </ActionForm>
      <p>{t("Already have an account?", "पहले से खाता है?")} <Link href="/login">{t("Log in", "लॉग इन")}</Link></p>
    </section>
  );
}
