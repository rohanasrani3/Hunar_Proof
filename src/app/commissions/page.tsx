import { DirectoryTile } from "@/components/directory-tile";
import Link from "next/link";
import { forms, commissions } from "@/server/market";
import { viewer } from "@/server/auth";
import { language } from "@/i18n/language";
import { Filters, Sample, stateName } from "@/components/discovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; form?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [{ lang, t }, all, items, user] = await Promise.all([
    language(),
    forms(),
    commissions(params),
    viewer(),
  ]);
  return (
    <>
      <div className="heading">
        <h1>{t("Commission work", "कमीशन कार्य")}</h1>
        {user?.role !== "artist" && (
          <Link className="button" href={user ? "/commissions/new" : "/login"}>
            {t("Post a commission", "कमीशन पोस्ट करें")}
          </Link>
        )}
      </div>
      <Filters all={all} params={params} status />
      <div className="directory-grid">
        {items.map((c) => {
          const form = all.find((f) => f.id === c.form);
          return (
            <DirectoryTile
              key={c.id}
              href={"/commissions/" + c.id}
              title={c.title}
              cover={
                c.output && /\.(png|jpg|webp)$/i.test(c.output)
                  ? "/api/media/" + c.output
                  : c.sample && c.form === "block-print"
                    ? "/seed/blockprint-sample.svg"
                    : c.sample && c.form === "warli"
                      ? "/seed/warli-final.svg"
                      : undefined
              }
              formLabel={form?.[lang === "hi" ? "hi" : "name"] ?? c.form}
              action={t("View commission", "कमीशन देखें")}
              footer={
                <>
                  <span>
                    {stateName(c.status, lang === "hi")} · ₹
                    {Number(c.fee).toLocaleString("en-IN")}
                  </span>
                  {Boolean(c.sample) && <Sample />}
                </>
              }
            >
              <p>{c.brief}</p>
              <small>
                <Link href={"/people/" + c.customer_username}>
                  {c.customer_name}
                </Link>{" "}
                · {form?.[lang === "hi" ? "hi" : "name"]}
              </small>
            </DirectoryTile>
          );
        })}
      </div>
      {!items.length && (
        <p>
          {t(
            "No commissions match these filters.",
            "इन फ़िल्टर से कोई कमीशन नहीं मिला।",
          )}
        </p>
      )}
    </>
  );
}
