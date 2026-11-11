import { FilterFields } from "./filter-fields";
import type { Form } from "@/contract/schemas";
import { language } from "@/i18n/language";
export function stateName(s: string, hi: boolean) {
  return (
    {
      finding: hi ? "कलाकार की तलाश" : "Finding",
      progress: hi ? "प्रगति पर" : "In-progress",
      done: hi ? "पूर्ण" : "Done",
    } as Record<string, string>
  )[s];
}
export async function Sample() {
  const { t } = await language();
  return <span className="sample">{t("Sample data", "नमूना डेटा")}</span>;
}
export async function Filters({
  all,
  params,
  status = false,
}: {
  all: Form[];
  params: { category?: string; form?: string; status?: string };
  status?: boolean;
}) {
  const { lang, t } = await language();
  return (
    <form className="filters">
      <FilterFields
        all={all}
        lang={lang}
        initialCategory={params.category}
        initialForm={params.form}
      />{" "}
      {status && (
        <label>
          {t("Status", "स्थिति")}
          <select name="status" defaultValue={params.status}>
            <option value="">{t("All statuses", "सभी स्थितियाँ")}</option>
            {["finding", "progress", "done"].map((s) => (
              <option key={s} value={s}>
                {stateName(s, lang === "hi")}
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="pill">{t("Apply filters", "फ़िल्टर लगाएँ")}</button>
    </form>
  );
}
