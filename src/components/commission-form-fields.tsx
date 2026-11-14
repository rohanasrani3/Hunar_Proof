"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/contract/artForms";
import type { Form } from "@/contract/schemas";
import { OUTPUT_LABELS } from "@/lib/commission-display";
const prompts: Record<string, [string, string]> = {
  audio: ["Describe the style, duration, language, recording quality and file format you need. Include your deadline and any reference tracks.", "शैली, अवधि, भाषा, रिकॉर्डिंग की गुणवत्ता और फ़ाइल प्रारूप बताएँ। समय-सीमा और संदर्भ संगीत भी जोड़ें।"],
  video: ["Mention video quality, aspect ratio, dimensions, duration and file format. Describe the story, style, sound and deadline.", "वीडियो की गुणवत्ता, आस्पेक्ट रेशियो, आकार, अवधि और फ़ाइल प्रारूप बताएँ। कहानी, शैली, ध्वनि और समय-सीमा लिखें।"],
  live: ["Tell the artist about the occasion, date, location, audience size and performance duration. Mention travel, equipment and rehearsal arrangements.", "अवसर, तारीख, स्थान, दर्शकों की संख्या और प्रस्तुति की अवधि बताएँ। यात्रा, उपकरण और रिहर्सल की व्यवस्था भी लिखें।"],
  physical: ["Describe the subject, dimensions, materials, quantity and finish. Include your delivery location, packaging needs and deadline.", "विषय, आकार, सामग्री, संख्या और फिनिश बताएँ। डिलीवरी का स्थान, पैकिंग और समय-सीमा भी लिखें।"],
  image: ["Describe the subject and visual style. Mention image dimensions, resolution, file format, print or digital use, and your deadline.", "विषय और दृश्य शैली बताएँ। चित्र का आकार, रिज़ॉल्यूशन, फ़ाइल प्रारूप, प्रिंट या डिजिटल उपयोग और समय-सीमा लिखें।"],
  other: ["Describe exactly what you need delivered, how you will use it, any technical requirements, and your deadline.", "क्या तैयार चाहिए, उसका उपयोग, तकनीकी ज़रूरतें और समय-सीमा विस्तार से बताएँ।"],
};

export function CommissionFormFields({ all, lang }: { all: Form[]; lang: "en" | "hi" }) {
  const [category, setCategory] = useState("");
  const [form, setForm] = useState("");
  const [output, setOutput] = useState("");
  const [preview, setPreview] = useState("");
  const reference = useRef<HTMLInputElement>(null);
  const hi = lang === "hi";
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return (
    <>
      <div className="commission-field-pair">
        <label>{hi ? "कला श्रेणी" : "Art category"}
          <select name="category" value={category} onChange={(e) => { setCategory(e.target.value); setForm(""); }} required>
            <option value="">{hi ? "श्रेणी चुनें" : "Choose a category"}</option>
            {Object.entries(CATEGORIES).map(([id, label]) => <option key={id} value={id}>{label[lang]}</option>)}
          </select>
        </label>
        <label>{hi ? "कला विधा" : "Art form"}
          <select name="form" value={form} onChange={(e) => setForm(e.target.value)} disabled={!category} required>
            <option value="">{hi ? "कला विधा चुनें" : "Choose an art form"}</option>
            {all.filter((item) => item.category === category).map((item) => <option key={item.id} value={item.id}>{hi ? item.hi : item.name}</option>)}
            <option value="__other__">{hi ? "अन्य विधा जोड़ें" : "Add another art form"}</option>
          </select>
        </label>
      </div>
      {form === "__other__" && <label>{hi ? "कला विधा का नाम" : "Name the art form"}<input name="otherForm" maxLength={120} required /></label>}
      <label>{hi ? "आप किस रूप में कार्य चाहते हैं?" : "What should the artist deliver?"}
        <select name="output_type" value={output} onChange={(e) => setOutput(e.target.value)} required>
          <option value="">{hi ? "तैयार कार्य का रूप चुनें" : "Choose an output format"}</option>
          {Object.entries(OUTPUT_LABELS).map(([id, names]) => <option key={id} value={id}>{names[hi ? 1 : 0]}</option>)}
        </select>
      </label>
      <label>{hi ? "कार्य का विवरण" : "The brief"}
        <textarea name="brief" maxLength={4000} required rows={7} placeholder={prompts[output]?.[hi ? 1 : 0] ?? (hi ? "ऊपर कार्य का रूप चुनें, फिर अपनी ज़रूरत बताएँ।" : "Choose an output format above, then tell the artist what you have in mind.")} />
        <span className="field-help">{hi ? "स्पष्ट विवरण से कलाकार बेहतर प्रस्ताव दे सकते हैं।" : "A clear brief helps artists give you a considered proposal."}</span>
      </label>
      <label>{hi ? "कार्य पूरा होने की समय-सीमा" : "Work deadline"}
        <input type="date" name="deadline" required />
        <span className="field-help">{hi ? "तैयार कार्य मिलने की अंतिम तारीख चुनें।" : "Choose the date by which you need the finished work."}</span>
      </label>
      <div className="reference-upload">
        <label>{hi ? "संदर्भ चित्र" : "Reference image"} <span className="field-optional">{hi ? "वैकल्पिक" : "Optional"}</span>
          <input ref={reference} type="file" name="reference" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : "")} />
          <span className="field-help">{hi ? "JPG, PNG या WebP · अधिकतम 5 MB। आपके सार्वजनिक अनुरोध पर दिखेगा।" : "JPG, PNG or WebP · up to 5 MB. Visible with your public brief."}</span>
        </label>
        {preview && <div className="reference-preview"><Image src={preview} unoptimized width={500} height={300} alt={hi ? "संदर्भ का पूर्वावलोकन" : "Reference preview"} /><button className="pill" type="button" onClick={() => { setPreview(""); if (reference.current) reference.current.value = ""; }}>{hi ? "चित्र हटाएँ" : "Remove image"}</button></div>}
      </div>
      <label>{hi ? "आपका प्रस्तावित बजट (₹)" : "Your proposed budget (₹)"}
        <input type="number" inputMode="numeric" min="0" max="100000000" step="1" name="fee" placeholder="8000" required />
        <span className="field-help">{hi ? "कलाकार यह राशि स्वीकार कर सकते हैं या अपना मूल्य भेज सकते हैं।" : "Artists can agree to this amount or send their own quotation."}</span>
      </label>
    </>
  );
}
