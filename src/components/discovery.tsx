import { FilterFields } from "./filter-fields";
import type { Form } from "@/contract/schemas";
import { language } from "@/i18n/language";
import Link from "next/link";
export function stateName(s: string, hi: boolean) {
  return (
    {
      finding: hi ? "प्रस्ताव आमंत्रित हैं" : "Open for proposals",
      progress: hi ? "काम जारी है" : "In progress",
      done: hi ? "पूर्ण" : "Completed",
    } as Record<string, string>
  )[s];
}
export async function Sample() {
  const { t } = await language();
  return <span className="sample" title={t("Fictional pilot example. Included in demo rankings and impact.", "काल्पनिक पायलट उदाहरण। डेमो रैंकिंग और प्रभाव में शामिल।")}>{t("Sample data", "नमूना डेटा")}</span>;
}
export async function Filters({
  all,
  params,
  status = false,
  href,
}: {
  all: Form[];
  params: { category?: string; form?: string; status?: string };
  status?: boolean;
  href?: string;
}) {
  const { lang, t } = await language();
  return (
    <form className="filters" action={href ?? (status ? "/commissions" : "/talent")}>
      <FilterFields
        key={`${params.category ?? ""}:${params.form ?? ""}`}
        all={all}
        lang={lang}
        initialCategory={params.category}
        initialForm={params.form}
      />{" "}
      {status && (
        <label>
          {t("Status", "स्थिति")}
          <select key={params.status ?? ""} name="status" defaultValue={params.status ?? ""}>
            <option value="">{t("All statuses", "सभी स्थितियाँ")}</option>
            {["finding", "done"].map((s) => (
              <option key={s} value={s}>
                {stateName(s, lang === "hi")}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="filter-actions">
        <button className="button">{t("Apply filters", "फ़िल्टर लगाएँ")}</button>
        {(params.category || params.form || (status && params.status !== "finding")) && <Link className="clear-filters" href={href ?? (status ? "/commissions" : "/talent")}>{t("Clear filters", "फ़िल्टर हटाएँ")} <span aria-hidden="true">×</span></Link>}
      </div>
    </form>
  );
}
