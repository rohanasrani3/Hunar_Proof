import { notFound } from "next/navigation";
import Link from "next/link";
import { viewer } from "@/server/auth";
import { commissions, proposals, forms } from "@/server/market";
import { commissionAction } from "@/server/actions";
import { language } from "@/i18n/language";
import { ActionForm } from "@/components/action-form";
import { Sample, stateName } from "@/components/discovery";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user, { lang, t }, all] = await Promise.all([
    params,
    viewer(),
    language(),
    forms(),
  ]);
  const [c] = await commissions({}, id, user?.id);
  if (!c) notFound();
  const owner = user?.id === c.customer,
    assigned = user?.id === c.artist;
  const offers = user ? await proposals(id, user.id) : [],
    form = all.find((f) => f.id === c.form);
  const action = (name: string, label: string, children?: React.ReactNode) =>
    c.paused ? null : (
      <ActionForm lang={lang} action={commissionAction} label={label}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="action" value={name} />
        {children}
      </ActionForm>
    );
  return (
    <section className="narrow">
      <Link href="/commissions">← {t("Commissions", "कमीशन")}</Link>
      <p className="meta">
        {stateName(c.status, lang === "hi")} {Boolean(c.sample) && <Sample />}
      </p>
      <h1>{c.title}</h1>
      {Boolean(c.paused) && (
        <p role="status">
          {t(
            "Actions are paused while a participant is suspended.",
            "एक सदस्य का खाता निलंबित है। इस कार्य पर कार्रवाई रुकी हुई है।",
          )}
        </p>
      )}
      <p className="pre">{c.brief}</p>
      <p>
        <Link href={"/people/" + c.customer_username}>{c.customer_name}</Link> ·{" "}
        {form?.[lang === "hi" ? "hi" : "name"]} · ₹
        {Number(c.fee).toLocaleString("en-IN")}
      </p>
      {c.status === "finding" && !c.sample && !user && (
        <Link href="/login">
          {t(
            "Log in as an artist to send a proposal",
            "प्रस्ताव भेजने के लिए कलाकार खाते में लॉग इन करें",
          )}
        </Link>
      )}
      {c.status === "finding" &&
        !c.sample &&
        user?.role === "artist" &&
        !offers.length &&
        action(
          "propose",
          t("Send private proposal", "निजी प्रस्ताव भेजें"),
          <label>
            {t("Your proposal", "आपका प्रस्ताव")}
            <textarea name="message" maxLength={4000} required />
          </label>,
        )}
      {(owner || offers.length > 0) && (
        <section>
          <h2>{t("Private proposals", "निजी प्रस्ताव")}</h2>
          {offers.map((p) => (
            <article className="card" key={p.id}>
              <Link href={"/people/" + p.username}>{p.name}</Link>
              <p className="pre">{p.message}</p>
              {owner &&
                c.status === "finding" &&
                action(
                  "select",
                  t("Select this artist", "इस कलाकार को चुनें"),
                  <input type="hidden" name="proposal" value={p.id} />,
                )}
            </article>
          ))}
          {!offers.length && (
            <p>{t("No proposals yet.", "अभी कोई प्रस्ताव नहीं है।")}</p>
          )}
        </section>
      )}
      {assigned &&
        c.status === "progress" &&
        !c.output &&
        action(
          "submit",
          t("Submit finished work", "तैयार कार्य जमा करें"),
          <label>
            {t(
              "Finished file (image, audio or MP4, up to 5 MB)",
              "तैयार फ़ाइल (चित्र, ऑडियो या MP4, अधिकतम 5 MB)",
            )}
            <input
              name="file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.wav,.mp3,.mp4"
              required
            />
          </label>,
        )}
      {c.output && (
        <p>
          <a className="pill" href={"/api/media/" + c.output}>
            {t("View finished work", "तैयार कार्य देखें")}
          </a>
        </p>
      )}
      {owner &&
        c.status === "progress" &&
        c.output &&
        action("accept", t("Accept finished work", "तैयार कार्य स्वीकार करें"))}
      {owner &&
        c.status === "done" &&
        action(
          "visibility",
          t("Save visibility", "दृश्यता सहेजें"),
          <label>
            <input
              type="checkbox"
              name="public"
              defaultChecked={Boolean(c.published)}
            />{" "}
            {t(
              "Show finished work publicly",
              "तैयार कार्य सार्वजनिक रूप से दिखाएँ",
            )}
          </label>,
        )}
    </section>
  );
}
