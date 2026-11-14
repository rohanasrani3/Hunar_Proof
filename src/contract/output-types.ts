export const OUTPUT_TYPES = {
  audio: { en: "Audio recording", hi: "ऑडियो रिकॉर्डिंग" },
  video: { en: "Video", hi: "वीडियो" },
  live: { en: "Live performance", hi: "लाइव प्रस्तुति" },
  physical: { en: "Physical artwork", hi: "भौतिक कलाकृति" },
  image: { en: "Digital image", hi: "डिजिटल चित्र" },
  other: { en: "Other", hi: "अन्य" },
} as const;
export type OutputType = keyof typeof OUTPUT_TYPES;
export const OUTPUT_HINTS: Record<OutputType, { en: string; hi: string }> = {
  audio: { en: "Describe the duration, style, instruments, audio format and where the recording will be used.", hi: "अवधि, शैली, वाद्ययंत्र, ऑडियो फ़ॉर्मैट और रिकॉर्डिंग के उपयोग के बारे में बताएँ।" },
  video: { en: "Mention video quality, aspect ratio, dimensions, duration, file format and any editing needs.", hi: "वीडियो गुणवत्ता, आस्पेक्ट रेशियो, आकार, अवधि, फ़ाइल फ़ॉर्मैट और संपादन की ज़रूरत बताएँ।" },
  live: { en: "Share the event date, venue, performance duration, audience size and equipment arrangements.", hi: "कार्यक्रम की तारीख, स्थान, प्रस्तुति की अवधि, दर्शकों की संख्या और उपकरणों की व्यवस्था बताएँ।" },
  physical: { en: "Mention dimensions, materials, quantity, finish, delivery location and required delivery date.", hi: "आकार, सामग्री, संख्या, फ़िनिश, डिलीवरी का स्थान और आवश्यक तारीख बताएँ।" },
  image: { en: "Describe the image dimensions, resolution, colour palette, file format and intended use.", hi: "चित्र का आकार, रिज़ॉल्यूशन, रंग, फ़ाइल फ़ॉर्मैट और उपयोग बताएँ।" },
  other: { en: "Describe the finished result, specifications, quantity, deadline and how it should be delivered.", hi: "तैयार कार्य, विशेष विवरण, संख्या, समयसीमा और डिलीवरी का तरीका बताएँ।" },
};
