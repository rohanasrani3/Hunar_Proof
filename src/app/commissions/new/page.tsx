import { redirect } from "next/navigation";
import { viewer } from "@/server/auth";
import { forms } from "@/server/market";
import { postCommission } from "@/server/actions";
import { language } from "@/i18n/language";
import { ActionForm } from "@/components/action-form";
import { CommissionFormFields } from "@/components/commission-form-fields";
import Link from "next/link";
export default async function Page() {
  const [user, all, { lang, t }] = await Promise.all([
    viewer(),
    forms(),
    language(),
  ]);
  if (!user) redirect("/login");
  if (user.role === "artist") redirect("/commissions");
  return (
    <section className="narrow">
      <h1>{t("Post a commission", "कमीशन पोस्ट करें")}</h1>
      <fieldset disabled={user.role === "admin"}>
        <ActionForm
          lang={lang}
          action={postCommission}
          label={t("Publish brief", "अनुरोध प्रकाशित करें")}
        >
          <label>
            {t("Project title", "प्रोजेक्ट शीर्षक")}
            <input name="title" maxLength={120} required />
          </label>
          <label>
            {t("What would you like made?", "आप क्या बनवाना चाहते हैं?")}
            <textarea name="brief" maxLength={4000} required />
          </label>
          <CommissionFormFields all={all} lang={lang} />
          <label>
            {t("Budget in rupees", "बजट (रुपये)")}
            <input type="number" min="0" max="100000000" name="fee" required />
          </label>
        </ActionForm>
      </fieldset>
      <Link className="pill" href="/commissions">{t("Cancel", "रद्द करें")}</Link>
    </section>
  );
}
