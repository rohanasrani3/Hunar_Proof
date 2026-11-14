"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { commissionAction } from "@/server/actions";
import { ActionForm } from "@/components/action-form";

export function SafetyAcknowledgment({ hi }: { hi: boolean }) {
  return <div className="contact-notice">
    <strong>{hi ? "काम शुरू करने से पहले बात करें" : "Contact each other before starting work"}</strong>
    <p>{hi ? "पहचान की पुष्टि करें और काम, समय-सीमा व भुगतान की शर्तें तय करें। संदिग्ध अग्रिम भुगतान, OTP या पासवर्ड की माँग से सावधान रहें। KareGhar भुगतान नहीं सँभालता।" : "Verify who you are working with and agree on scope, timing and payment. Be alert to suspicious advance-payment requests, and never share an OTP or password. KareGhar does not handle payments."}</p>
    <label className="check-label"><input type="checkbox" name="acknowledged" required /><span>{hi ? "मैं काम शुरू होने से पहले दूसरे पक्ष से संपर्क करूँगा/करूँगी और शर्तें स्पष्ट करूँगा/करूँगी।" : "I will contact the other person and confirm the terms before work begins."}</span></label>
  </div>;
}

export function ProposalForm({ id, fee, hi, edit, onCancel }: { id: string; fee: number; hi: boolean; edit?: { message: string; pricing: string; quote: number }; onCancel?: () => void }) {
  const [pricing, setPricing] = useState(edit?.pricing ?? "offered");
  const router = useRouter();
  const amount = "₹" + Number(fee).toLocaleString("en-IN");
  return <ActionForm action={commissionAction} lang={hi ? "hi" : "en"} label={edit ? (hi ? "प्रस्ताव अपडेट करें" : "Update proposal") : (hi ? "निजी प्रस्ताव भेजें" : "Send private proposal")} onSuccess={() => { if (onCancel) onCancel(); router.push("/profile/history/" + id); router.refresh(); }}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="action" value={edit ? "editProposal" : "propose"} />
    <fieldset className="quote-options">
      <legend>{hi ? "आपका मूल्य" : "Your price"}</legend>
      <label className={pricing === "offered" ? "quote-option selected" : "quote-option"}><input type="radio" name="pricing" value="offered" checked={pricing === "offered"} onChange={() => setPricing("offered")} /><span><strong>{hi ? amount + " पर काम करें" : "Work for " + amount}</strong><small>{hi ? "ग्राहक का प्रस्तावित बजट स्वीकार करें" : "Accept the customer's proposed budget"}</small></span></label>
      <label className={pricing === "quote" ? "quote-option selected" : "quote-option"}><input type="radio" name="pricing" value="quote" checked={pricing === "quote"} onChange={() => setPricing("quote")} /><span><strong>{hi ? "अपना मूल्य दें" : "Send your quotation"}</strong><small>{hi ? "कार्य के अनुसार उचित राशि सुझाएँ" : "Suggest an amount for the work involved"}</small></span></label>
    </fieldset>
    {pricing === "quote" && <label>{hi ? "आपका मूल्य (₹)" : "Your quotation (₹)"}<input type="number" name="quote" inputMode="numeric" min="0" max="100000000" step="1" defaultValue={edit?.quote} required /></label>}
    <label>{hi ? "आपका प्रस्ताव" : "Introduce your approach"}<textarea name="message" defaultValue={edit?.message} required maxLength={4000} rows={5} placeholder={hi ? "आप कैसे काम करेंगे? संबंधित अनुभव, समय-सीमा और पूछने योग्य बातें लिखें।" : "How would you approach this? Share relevant experience, your timeline and any questions."} /></label>
    <SafetyAcknowledgment hi={hi} />
    <p className="field-help">{hi ? "यह प्रस्ताव केवल ग्राहक देख सकता है। भेजने के 15 मिनट के भीतर इसे संपादित किया जा सकता है।" : "Only the customer can see your proposal. You can edit it for 15 minutes after sending."}</p>
    {onCancel && <button type="button" className="pill" onClick={onCancel}>{hi ? "रद्द करें" : "Cancel edit"}</button>}
  </ActionForm>;
}
