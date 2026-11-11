import { language } from "@/i18n/language";
import { register } from "@/server/actions";
import { ActionForm } from "@/components/action-form";
export default async function Page() {
  const { t, lang } = await language();
  return (
    <section className="narrow">
      <h1>{t("Create an account", "खाता बनाएँ")}</h1>
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
    </section>
  );
}
