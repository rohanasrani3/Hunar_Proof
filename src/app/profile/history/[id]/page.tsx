import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { viewer } from "@/server/auth";
import { historyDetail, unreadCount } from "@/server/history";
import { markHistoryRead } from "@/server/history-actions";
import { forms } from "@/server/market";
import { commissionAction } from "@/server/actions";
import { language } from "@/i18n/language";
import { ActionForm } from "@/components/action-form";
import { ProfileTabs } from "@/components/profile-tabs";
import { Sample, stateName } from "@/components/discovery";
import { PortfolioGallery } from "@/components/portfolio-gallery";
import { SafetyAcknowledgment } from "@/components/proposal-form";
import { HistoryRefresh, MessageComposer, ProposalEditor } from "@/components/history-controls";
import { OUTPUT_LABELS, activityDate, deadlineDate, mediaUrl, rupees } from "@/lib/commission-display";
import "@/components/commissions.css";

const eventNames: Record<string, [string, string]> = {
  posted: ["Brief posted", "अनुरोध पोस्ट किया गया"],
  created: ["Brief posted", "अनुरोध पोस्ट किया गया"],
  proposed: ["Proposal received", "प्रस्ताव मिला"],
  proposal: ["Proposal received", "प्रस्ताव मिला"],
  proposal_edited: ["Proposal updated", "प्रस्ताव अपडेट हुआ"],
  edited: ["Proposal updated", "प्रस्ताव अपडेट हुआ"],
  selected: ["Artist selected", "कलाकार चुना गया"],
  cancelled: ["Selection cancelled", "चयन रद्द किया गया"],
  submitted: ["Finished work submitted", "तैयार कार्य जमा किया गया"],
  accepted: ["Finished work accepted", "तैयार कार्य स्वीकार किया गया"],
  visibility: ["Sharing preference updated", "दृश्यता अपडेट हुई"],
  published: ["Finished work shared", "तैयार कार्य सार्वजनिक हुआ"],
  hidden: ["Finished work made private", "तैयार कार्य निजी हुआ"],
  message: ["Message sent", "संदेश भेजा गया"],
};

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ artist?: string }> }) {
  const [user, { t, lang }, { id }, search, all] = await Promise.all([viewer(), language(), params, searchParams, forms()]);
  if (!user) redirect("/login");
  const now = Date.now();
  const [detail, unread] = await Promise.all([historyDetail(id, user.id), unreadCount(user.id)]);
  if (!detail) notFound();
  const { commission: c, proposals, events, messages } = detail;
  const hi = lang === "hi";
  const owner = c.customer === user.id;
  const assigned = c.artist === user.id;
  const editable = !c.paused && !c.sample;
  const form = all.find((item) => item.id === c.form);
  const formLabel = form?.[hi ? "hi" : "name"] ?? c.form;
  const myProposal = proposals.find((proposal) => proposal.artist === user.id);
  const conversations = proposals.map((proposal) => ({ artist: proposal.artist, name: proposal.name, username: proposal.username, contact: proposal.contact }));
  if (c.artist && !conversations.some((thread) => thread.artist === c.artist)) conversations.unshift({ artist: c.artist, name: c.artist_name ?? t("Selected artist", "चुना गया कलाकार"), username: c.artist_username ?? "", contact: c.artist_contact ?? "" });
  const selectedThread = owner ? conversations.find((thread) => thread.artist === search.artist) ?? conversations.find((thread) => thread.artist === c.artist) ?? conversations[0] : conversations.find((thread) => thread.artist === user.id);
  const threadMessages = messages.filter((message) => message.artist === selectedThread?.artist);
  const archived = [...new Map(events.filter((event) => event.output && event.output !== c.output).map((event) => [event.output, event])).values()];
  const progressStep = c.status === "done" ? 3 : c.output ? 2 : c.status === "progress" ? 1 : 0;
  const action = (name: string, label: string, children?: React.ReactNode) => editable ? <ActionForm action={commissionAction} lang={lang} label={label}><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={name} />{children}</ActionForm> : null;
  return <div className="history-workspace">
    <Link className="back-link" href="/profile/history">← {t("Work history", "कार्य इतिहास")}</Link>
    <header className="workspace-heading"><div className="commission-meta"><span className={"work-state state-" + c.status}>{stateName(c.status, hi)}</span><span>{formLabel}</span>{Boolean(c.sample) && <Sample />}</div><h1>{c.title}</h1><p>{t("Your private project workspace", "आपके प्रोजेक्ट का निजी कार्यस्थल")}</p></header>
    <ProfileTabs artist={user.role === "artist"} active="history" hi={hi} unread={unread} />
    <div className="history-toolbar"><HistoryRefresh hi={hi} /><ActionForm action={markHistoryRead} lang={lang} label={t("Mark updates as read", "सूचनाएँ पढ़ी हुई चिह्नित करें")} className="read-updates-form"><input type="hidden" name="id" value={id} /><input type="hidden" name="seenAt" value={now} /></ActionForm></div>
    {Boolean(c.paused) && <div className="subtle-notice" role="status">{t("This project is paused while a participant's account is unavailable. Your history remains here.", "एक सदस्य का खाता उपलब्ध न होने के कारण यह काम रुका है। आपका इतिहास यहाँ सुरक्षित है।")}</div>}
    <ol className="project-progress" aria-label={t("Project progress", "कार्य की प्रगति")}>
      {[[t("Brief posted", "अनुरोध पोस्ट"), c.created], [t("Artist selected", "कलाकार चुना"), c.selected_at], [t("Work submitted", "कार्य जमा"), c.submitted_at], [t("Work accepted", "कार्य स्वीकार"), c.accepted_at]].map(([label, date], index) => <li key={String(label)} className={index <= progressStep ? "reached" : ""} aria-current={index === progressStep ? "step" : undefined}><span className="progress-marker">{index < progressStep ? "✓" : index + 1}</span><strong>{label}</strong>{Number(date) > 0 && <small>{new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(Number(date))}</small>}</li>)}
    </ol>
    <div className="commission-layout history-detail-layout">
      <div className="commission-main">
        <section className="workspace-panel project-summary"><h2>{t("Project details", "कार्य का विवरण")}</h2><dl className="commission-facts">
          <div><dt>{t("Original budget", "मूल बजट")}</dt><dd>{rupees(c.original_fee)}</dd></div>
          <div><dt>{c.artist ? t("Agreed fee", "तय शुल्क") : t("Proposed budget", "प्रस्तावित बजट")}</dt><dd>{rupees(c.fee)}</dd></div>
          <div><dt>{t("Output format", "तैयार कार्य का रूप")}</dt><dd>{OUTPUT_LABELS[c.output_type]?.[hi ? 1 : 0] ?? t("To be discussed", "बात करके तय करें")}</dd></div>
          <div><dt>{t("Work deadline", "कार्य की समय-सीमा")}</dt><dd>{deadlineDate(c.deadline, hi)}</dd></div>
        </dl><p className="pre">{c.brief}</p>{c.reference && <details className="reference-details"><summary>{t("View reference image", "संदर्भ चित्र देखें")}</summary><Image src={mediaUrl(c.reference)} width={800} height={500} unoptimized alt={t("Customer's reference", "ग्राहक का संदर्भ चित्र")} /></details>}</section>

        {owner && <section className="workspace-panel" id="proposals"><div className="panel-heading"><h2>{t("Private proposals", "निजी प्रस्ताव")}</h2><span className="history-count">{proposals.length}</span></div>{!proposals.length && <div className="section-empty"><p>{t("The right artist may be just around the corner.", "आपके लिए उपयुक्त कलाकार जल्द मिल सकता है।")}</p><small>{t("New proposals will appear here. You can talk privately before making a choice.", "नए प्रस्ताव यहाँ दिखेंगे। चुनने से पहले निजी बातचीत कर सकते हैं।")}</small></div>}
          <div className="proposal-list">{proposals.map((proposal) => <article className="proposal-card" key={proposal.id}><div className="proposal-top"><div><Link href={"/people/" + proposal.username}>{proposal.name}</Link><small>{activityDate(proposal.created, hi)}</small></div><strong>{rupees(proposal.quote)}</strong></div><p className="pre">{proposal.message}</p>{proposal.quote !== proposal.initial_quote && <p className="field-help">{t("Initial quotation: ", "शुरुआती मूल्य: ")}{rupees(proposal.initial_quote)}</p>}{proposal.contact && <p className="proposal-contact"><strong>{t("Contact: ", "संपर्क: ")}</strong>{proposal.contact}</p>}<div className="proposal-bottom"><Link href={"/profile/history/" + id + "?artist=" + encodeURIComponent(proposal.artist) + "#messages"}>{t("Message artist", "कलाकार को संदेश भेजें")} ↗</Link>{proposal.status === "cancelled" ? <span className="meta">{t("Selection cancelled", "चयन रद्द")}</span> : c.artist === proposal.artist ? <span className="work-state state-progress">{t("Selected", "चुना गया")}</span> : null}</div>
            {editable && c.status === "finding" && proposal.status === "active" && <details className="selection-confirm"><summary>{t("Accept proposal & commission work", "प्रस्ताव स्वीकार करें और काम सौंपें")}</summary>{action("select", t("Confirm commission", "काम सौंपने की पुष्टि करें"), <><input type="hidden" name="proposal" value={proposal.id} /><p>{t("Accept this proposal to commission the artist. The agreed project fee will be ", "यह प्रस्ताव स्वीकार करके कलाकार को काम सौंपें। काम का तय शुल्क होगा ")}<strong>{rupees(proposal.quote)}</strong>.</p><SafetyAcknowledgment hi={hi} /></>)}</details>}
          </article>)}</div>
        </section>}

        {!owner && myProposal && <section className="workspace-panel"><h2>{t("Your proposal", "आपका प्रस्ताव")}</h2><div className="quotation-summary"><strong>{rupees(myProposal.quote)}</strong><span>{activityDate(myProposal.created, hi)}</span></div><p className="pre">{myProposal.message}</p>{myProposal.quote !== myProposal.initial_quote && <p className="field-help">{t("Initial quotation: ", "शुरुआती मूल्य: ")}{rupees(myProposal.initial_quote)}</p>}{editable && c.status === "finding" && myProposal.status === "active" && <ProposalEditor id={id} fee={c.original_fee} proposal={myProposal} hi={hi} now={now} />}{myProposal.status === "cancelled" && <div className="subtle-notice">{t("The customer cancelled this selection. Your conversation and previous work remain in the history.", "ग्राहक ने यह चयन रद्द कर दिया है। आपकी बातचीत और पिछला कार्य इतिहास में सुरक्षित हैं।")}</div>}{c.artist && !assigned && <p className="field-help">{t("The customer is working with another artist.", "ग्राहक दूसरे कलाकार के साथ काम कर रहा है।")}</p>}</section>}

        {(owner || assigned) && <section className="workspace-panel" id="delivery"><h2>{t("Finished work", "तैयार कार्य")}</h2>
          {c.output ? <><PortfolioGallery hi={hi} items={[{ id: c.id, title: c.title, url: mediaUrl(c.output), formLabel }]} />{c.status === "progress" && <p className="field-help">{t("Submitted for the customer's review. It stays private until accepted and shared.", "ग्राहक की समीक्षा के लिए जमा किया गया। स्वीकार और सार्वजनिक किए जाने तक निजी रहेगा।")}</p>}{owner && c.status === "progress" && action("accept", t("Accept finished work", "तैयार कार्य स्वीकार करें"), <label className="check-label"><input type="checkbox" required /><span>{t("I have reviewed the submission and confirm that the agreed work is complete.", "मैंने जमा कार्य देखा है और पुष्टि करता/करती हूँ कि तय काम पूरा है।")}</span></label>)}</> : assigned && c.status === "progress" ? <><p>{t("Ready to share the result? Upload the finished file for your customer to review.", "तैयार कार्य साझा करना है? ग्राहक की समीक्षा के लिए फ़ाइल अपलोड करें।")}</p>{["physical", "live"].includes(c.output_type) && <p className="field-help">{t("For physical artwork or live performances, upload a clear photo or short recording of the completed work.", "भौतिक कलाकृति या लाइव प्रस्तुति के लिए तैयार कार्य का स्पष्ट चित्र या छोटी रिकॉर्डिंग अपलोड करें।")}</p>}{action("submit", t("Submit finished work", "तैयार कार्य जमा करें"), <label>{t("Finished file", "तैयार फ़ाइल")}<input type="file" name="file" accept=".jpg,.jpeg,.png,.webp,.wav,.mp3,.mp4" required /><span className="field-help">{t("Image, audio or MP4 · up to 5 MB. Accepted submissions build your completion ranking.", "चित्र, ऑडियो या MP4 · अधिकतम 5 MB। स्वीकृत कार्य आपकी रैंकिंग में गिने जाते हैं।")}</span></label>)}</> : <p className="section-empty">{c.status === "finding" ? t("Choose an artist first. Their finished submission will appear here.", "पहले कलाकार चुनें। उसका तैयार कार्य यहाँ दिखेगा।") : t("The artist is working on your brief. Their submission will appear here.", "कलाकार आपके अनुरोध पर काम कर रहा है। तैयार कार्य यहाँ दिखेगा।")}</p>}
          {owner && c.status === "done" && action("visibility", t("Save sharing preference", "दृश्यता सहेजें"), <><label className="check-label"><input type="checkbox" name="public" defaultChecked={Boolean(c.published)} /><span>{t("Show the finished work publicly on the artist's profile and commission page.", "तैयार कार्य कलाकार की प्रोफ़ाइल और कमीशन पेज पर सार्वजनिक दिखाएँ।")}</span></label><p className="field-help">{t("You can change this any time. Accepted work counts toward the artist's ranking even when private.", "यह कभी भी बदल सकते हैं। निजी रहने पर भी स्वीकृत कार्य कलाकार की रैंकिंग में गिना जाता है।")}</p></>)}
        </section>}

        {archived.length > 0 && <section className="workspace-panel"><h2>{t("Previous submissions", "पिछले जमा कार्य")}</h2><p className="field-help">{t("Earlier work stays in your private history when a selection changes.", "चयन बदलने पर पहले जमा किया गया कार्य आपके निजी इतिहास में रहता है।")}</p><PortfolioGallery hi={hi} items={archived.map((event) => ({ id: event.id, title: t("Previous submission · ", "पिछला जमा कार्य · ") + activityDate(event.created, hi), url: mediaUrl(event.output), formLabel }))} /></section>}

        <section className="workspace-panel" id="messages"><div className="panel-heading"><h2>{t("Conversation", "बातचीत")}</h2><span className="meta">{t("Private", "निजी")}</span></div>
          {owner && conversations.length > 1 && <nav className="conversation-tabs" aria-label={t("Choose a conversation", "बातचीत चुनें")}>{conversations.map((thread) => <Link key={thread.artist} href={"/profile/history/" + id + "?artist=" + encodeURIComponent(thread.artist) + "#messages"} aria-current={selectedThread?.artist === thread.artist ? "page" : undefined}>{thread.name}</Link>)}</nav>}
          {selectedThread ? <><p className="conversation-with">{t("With ", "साथ: ")}<strong>{owner ? selectedThread.name : c.customer_name}</strong></p><div className="message-list" aria-label={t("Messages", "संदेश")}>{threadMessages.map((message) => <article key={message.id} className={message.sender === user.id ? "message-bubble own-message" : "message-bubble"}><div><strong>{message.sender === user.id ? t("You", "आप") : message.sender_name}</strong><time dateTime={new Date(Number(message.created)).toISOString()}>{activityDate(message.created, hi)}</time></div><p className="pre">{message.body}</p></article>)}{!threadMessages.length && <p className="section-empty">{t("Start with a hello. Confirm the scope, timeline and payment terms before work begins.", "नमस्ते से शुरुआत करें। काम से पहले विवरण, समय-सीमा और भुगतान तय करें।")}</p>}</div>{editable && <MessageComposer key={selectedThread.artist} id={id} artist={selectedThread.artist} hi={hi} />}</> : <p className="section-empty">{t("A private conversation opens when an artist sends a proposal.", "कलाकार के प्रस्ताव भेजने पर निजी बातचीत शुरू होगी।")}</p>}
        </section>
      </div>

      <aside className="commission-aside history-sidebar">
        <section className="customer-contact"><p className="meta">{owner ? t("Working with", "कलाकार") : t("Commissioned by", "अनुरोधकर्ता")}</p>{owner ? c.artist_username ? <Link className="customer-name" href={"/people/" + c.artist_username}>{c.artist_name}</Link> : <strong>{t("No artist selected yet", "अभी कोई कलाकार नहीं चुना")}</strong> : <Link className="customer-name" href={"/people/" + c.customer_username}>{c.customer_name}</Link>}{(owner ? c.artist_contact : c.customer_contact) && <><p className="contact-caption">{t("Contact", "संपर्क")}</p><p className="pre">{owner ? c.artist_contact : c.customer_contact}</p></>}</section>
        <section className="project-activity"><h2>{t("Activity", "गतिविधि")}</h2><p className="field-help">{t("Times shown in India Standard Time.", "समय भारतीय मानक समय के अनुसार है।")}</p><ol className="activity-timeline">{events.map((event) => <li key={event.id}><strong>{eventNames[event.kind]?.[hi ? 1 : 0] ?? t("Project updated", "कार्य अपडेट हुआ")}</strong><time dateTime={new Date(Number(event.created)).toISOString()}>{activityDate(event.created, hi)}</time>{event.actor_name && <small>{event.actor_name}</small>}{event.detail && <p className="pre">{event.detail}</p>}{event.quote !== null && <small>{rupees(event.quote)}</small>}</li>)}{!events.length && <li><strong>{t("Brief posted", "अनुरोध पोस्ट किया गया")}</strong><time>{activityDate(c.created, hi)}</time></li>}</ol></section>
        {owner && editable && c.status === "progress" && <details className="cancel-selection"><summary>{t("Need to change artist?", "कलाकार बदलना है?")}</summary><p>{t("Cancel this selection to reopen the brief. The conversation, quotation and earlier submissions stay in history.", "अनुरोध दोबारा खोलने के लिए चयन रद्द करें। बातचीत, मूल्य और पिछली फ़ाइलें इतिहास में रहेंगी।")}</p>{action("cancel", t("Cancel selection and reopen", "चयन रद्द करके अनुरोध खोलें"), <><label>{t("Reason for cancellation", "रद्द करने का कारण")}<textarea name="reason" minLength={1} maxLength={4000} required rows={3} /></label><label className="check-label"><input type="checkbox" required /><span>{t("I have discussed this change with the artist.", "मैंने इस बदलाव पर कलाकार से चर्चा की है।")}</span></label></>)}</details>}
      </aside>
    </div>
  </div>;
}
