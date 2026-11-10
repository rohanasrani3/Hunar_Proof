/**
 * Strings for the employer's "commission work" flow (mobile-first, Hindi + English).
 * Hindi drafted by the team — have a native speaker at the pilot employer check it.
 */
export type Lang = "en" | "hi";

const en = {
  newCommission: "Commission work",
  back: "Back",
  stepOf: (n: number) => `Step ${n} of 3`,
  s1Title: "What would you like made or performed?",
  s1Hint: "Write it in your own words. Mention the art form if you know it, where it is for, the size or length, and when you need it.",
  s1Label: "Your request",
  s1Placeholder:
    "For example: We are opening a café in Pune and want a Warli painting on the wall behind the counter. Something with village life and dancing.",
  s1Cta: "Draft the brief",
  s1TooShort: "Write at least a sentence so the agent understands what you need.",
  s2Title: "Check what “done” means",
  youWrote: "You wrote",
  agentNote: "Drafted by the Hunar Proof agent. Edit anything.",
  agentWorking: "The agent is writing…",
  approve: (i: number) => `Approve point ${i}`,
  edit: (i: number) => `Edit point ${i}`,
  remove: (i: number) => `Remove point ${i}`,
  save: "Save",
  approveAll: "Approve all",
  milestones: "Milestones",
  days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
  addCriterion: "+ Add a point",
  newCriterion: "New point",
  artForms: "Art form",
  onSite: "Artist works at your place",
  remote: "Artist works from home and sends the work",
  feeLabel: "Fee for the artist (₹)",
  feeHint: (n: string) => `Suggested fair fee: ${n}. You pay the artist directly.`,
  continueN: (a: number, t: number) => `Approve ${a} of ${t} and continue`,
  needOne: "Approve at least one point",
  redo: "Draft again",
  s3Title: "Commission published",
  s3Body:
    "We’ll match an artist and a guru who knows this art form. You’ll see photos or recordings as the work takes shape, and nothing is final until you accept it.",
  s3Summary: (n: number, d: number, fee: string) => `${n} points · about ${d} days · ${fee}`,
  s3Another: "Commission something else",
  s3View: "See your commissions",
  errorDraft: "The agent couldn’t draft this. Try again, or add the points yourself.",
  errorPublish: "Couldn’t publish. Check your connection and try again.",
  publishing: "Publishing…",
};

const hi: typeof en = {
  newCommission: "काम दें",
  back: "वापस",
  stepOf: (n: number) => `चरण ${n} / 3`,
  s1Title: "आप क्या बनवाना या प्रस्तुत करवाना चाहते हैं?",
  s1Hint: "अपने शब्दों में लिखें। कला का नाम पता हो तो लिखें, यह कहाँ के लिए है, आकार या समय, और कब तक चाहिए।",
  s1Label: "आपका अनुरोध",
  s1Placeholder:
    "उदाहरण: हम पुणे में एक कैफ़े खोल रहे हैं और काउंटर के पीछे की दीवार पर वारली चित्र चाहते हैं। गाँव का जीवन और नृत्य दिखे।",
  s1Cta: "विवरण तैयार करें",
  s1TooShort: "कम से कम एक वाक्य लिखें ताकि एजेंट समझ सके कि आपको क्या चाहिए।",
  s2Title: "जाँचें कि “पूरा” होने का मतलब क्या है",
  youWrote: "आपने लिखा",
  agentNote: "Hunar Proof एजेंट ने तैयार किया। आप कुछ भी बदल सकते हैं।",
  agentWorking: "एजेंट लिख रहा है…",
  approve: (i: number) => `बिंदु ${i} स्वीकार करें`,
  edit: (i: number) => `बिंदु ${i} बदलें`,
  remove: (i: number) => `बिंदु ${i} हटाएँ`,
  save: "सहेजें",
  approveAll: "सभी स्वीकार करें",
  milestones: "पड़ाव",
  days: (n: number) => `${n} दिन`,
  addCriterion: "+ बिंदु जोड़ें",
  newCriterion: "नया बिंदु",
  artForms: "कला",
  onSite: "कलाकार आपकी जगह पर काम करेगा",
  remote: "कलाकार घर से काम करके भेजेगा",
  feeLabel: "कलाकार का शुल्क (₹)",
  feeHint: (n: string) => `सुझाया गया उचित शुल्क: ${n}। भुगतान आप सीधे कलाकार को करेंगे।`,
  continueN: (a: number, t: number) => `${t} में से ${a} स्वीकार करें और आगे बढ़ें`,
  needOne: "कम से कम एक बिंदु स्वीकार करें",
  redo: "फिर से तैयार करें",
  s3Title: "काम प्रकाशित हो गया",
  s3Body:
    "हम एक कलाकार और इस कला को जानने वाले एक गुरु को चुनेंगे। काम बनते समय आप फ़ोटो या रिकॉर्डिंग देखेंगे, और आपकी स्वीकृति के बिना कुछ भी अंतिम नहीं होगा।",
  s3Summary: (n: number, d: number, fee: string) => `${n} बिंदु · लगभग ${d} दिन · ${fee}`,
  s3Another: "कुछ और बनवाएँ",
  s3View: "अपने काम देखें",
  errorDraft: "एजेंट इसे तैयार नहीं कर सका। फिर से कोशिश करें, या खुद बिंदु जोड़ें।",
  errorPublish: "प्रकाशित नहीं हो सका। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
  publishing: "प्रकाशित हो रहा है…",
};

export const employerStrings = { en, hi };
export type EmployerStrings = typeof en;
