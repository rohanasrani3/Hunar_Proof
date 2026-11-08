/**
 * Seed data for the mock backend: 1 org, 3 tasks at different stages,
 * 3 learners, 1 mentor. Placeholder names in [brackets] get replaced with
 * the real pilot NGO once it is confirmed — never present seed data as real
 * pilot impact.
 */
import type {
  Acceptance,
  Match,
  Org,
  Person,
  Review,
  Submission,
  Task,
} from "@/contract/schemas";

export interface DB {
  orgs: Org[];
  people: Person[];
  tasks: Task[];
  matches: Match[];
  submissions: Submission[];
  reviews: Review[];
  acceptances: Acceptance[];
  /** taskId → public work-sample slug (only for verified tasks) */
  slugs: Record<string, string>;
}

const d = (s: string) => new Date(s).toISOString();

export function createSeed(): DB {
  const orgs: Org[] = [
    { id: "o1", name: "[Pilot NGO]", kind: "NGO", contactName: "[Coordinator]", city: "Bengaluru" },
  ];

  const people: Person[] = [
    { id: "l1", role: "learner", name: "Ananya R.", githubLogin: "ananya-r", skills: ["React", "Next.js", "Twilio"], hoursPerWeek: 12, college: "B.Sc. Computer Science" },
    { id: "l2", role: "learner", name: "Rahul K.", githubLogin: "rahul-k", skills: ["Python", "PDF", "Flask"], hoursPerWeek: 8, college: "B.Tech IT" },
    { id: "l3", role: "learner", name: "Meera S.", githubLogin: "meera-s", skills: ["HTML", "CSS", "Performance"], hoursPerWeek: 10, college: "BCA" },
    { id: "m1", role: "mentor", name: "Karthik M.", githubLogin: "karthik-m", skills: ["React", "Node.js", "Python", "Performance"] },
    { id: "u-org", role: "org", name: "[Coordinator]", skills: [], orgId: "o1" },
    { id: "a1", role: "admin", name: "FirstShip Admin", skills: [] },
    { id: "e1", role: "employer", name: "Demo Employer", skills: [] },
  ];

  const tasks: Task[] = [
    {
      id: "t1",
      orgId: "o1",
      title: "Volunteer sign-up form with WhatsApp confirmations",
      rawRequest:
        "We need an online form for volunteers to sign up. It should send them a WhatsApp message so they know we got it.",
      status: "verified",
      skills: ["React", "Next.js", "Twilio"],
      estHours: 20,
      repoUrl: "https://github.com/example/volunteer-signup",
      learnerId: "l1",
      mentorId: "m1",
      createdAt: d("2026-11-08T09:00:00+05:30"),
      criteria: [
        { id: "c1", text: "Form collects name, phone, area and availability, and validates the phone number.", testable: true, aiGenerated: true, approved: true },
        { id: "c2", text: "Each sign-up gets a WhatsApp confirmation within one minute.", testable: true, aiGenerated: true, approved: true },
        { id: "c3", text: "Coordinators can export all sign-ups as a CSV file.", testable: true, aiGenerated: true, approved: true },
        { id: "c4", text: "Page loads in under 3 seconds on a throttled 3G connection.", testable: true, aiGenerated: true, approved: true },
        { id: "c5", text: "The form works in both Hindi and English.", testable: true, aiGenerated: false, approved: true },
      ],
      milestones: [
        { id: "ms1", title: "Form and validation", estDays: 2, criterionIds: ["c1", "c4", "c5"], status: "done" },
        { id: "ms2", title: "WhatsApp messages", estDays: 2, criterionIds: ["c2"], status: "done" },
        { id: "ms3", title: "Spreadsheet export", estDays: 1, criterionIds: ["c3"], status: "done" },
      ],
    },
    {
      id: "t2",
      orgId: "o1",
      title: "Automatic donation receipts as PDF",
      rawRequest:
        "Every time someone donates we type the receipt by hand in Word. Can it be made automatically and emailed to them?",
      status: "in_review",
      skills: ["Python", "PDF"],
      estHours: 16,
      repoUrl: "https://github.com/example/donation-receipts",
      learnerId: "l2",
      mentorId: "m1",
      createdAt: d("2026-11-09T10:00:00+05:30"),
      criteria: [
        { id: "c6", text: "A PDF receipt with the NGO logo, donor name, amount and date is generated for each donation.", testable: true, aiGenerated: true, approved: true },
        { id: "c7", text: "The receipt is emailed to the donor within five minutes.", testable: true, aiGenerated: true, approved: true },
        { id: "c8", text: "Receipt numbers are sequential and never repeat.", testable: true, aiGenerated: true, approved: true },
      ],
      milestones: [
        { id: "ms4", title: "PDF template", estDays: 2, criterionIds: ["c6", "c8"], status: "submitted" },
        { id: "ms5", title: "Email delivery", estDays: 1, criterionIds: ["c7"], status: "doing" },
      ],
    },
    {
      id: "t3",
      orgId: "o1",
      title: "Make the website load fast on phones",
      rawRequest: "Our website is very slow on phones. Most of our visitors use cheap Android phones.",
      status: "open",
      skills: ["HTML", "CSS", "Performance"],
      estHours: 12,
      createdAt: d("2026-11-10T11:00:00+05:30"),
      criteria: [
        { id: "c9", text: "Home page Lighthouse mobile performance score is 90 or higher.", testable: true, aiGenerated: true, approved: true },
        { id: "c10", text: "Images are compressed and lazy-loaded without visible quality loss.", testable: true, aiGenerated: true, approved: true },
        { id: "c11", text: "No existing page or link breaks.", testable: true, aiGenerated: true, approved: true },
      ],
      milestones: [
        { id: "ms6", title: "Audit and image fixes", estDays: 2, criterionIds: ["c9", "c10"], status: "todo" },
        { id: "ms7", title: "Regression check", estDays: 1, criterionIds: ["c11"], status: "todo" },
      ],
    },
  ];

  const matches: Match[] = [
    { id: "mt1", taskId: "t1", learnerId: "l1", mentorId: "m1", score: 0.91, reasons: ["Knows React and Twilio", "12 h/week available"], status: "confirmed" },
    { id: "mt2", taskId: "t2", learnerId: "l2", mentorId: "m1", score: 0.84, reasons: ["Python + PDF experience"], status: "confirmed" },
    { id: "mt3", taskId: "t3", learnerId: "l3", mentorId: "m1", score: 0.88, reasons: ["Listed Performance as a skill", "10 h/week covers the 12 h estimate in ~1 week", "Mentor has Performance expertise"], status: "suggested" },
    { id: "mt4", taskId: "t3", learnerId: "l1", mentorId: "m1", score: 0.62, reasons: ["Strong front-end skills", "Already shipped one task — prioritise new learners"], status: "suggested" },
  ];

  const submissions: Submission[] = [
    { id: "s1", taskId: "t1", milestoneId: "ms3", prUrl: "https://github.com/example/volunteer-signup/pull/14", previewUrl: "https://volunteer-signup-preview.vercel.app", ciStatus: "pass", testsPassed: 18, testsTotal: 18, commits: 9, additions: 412, deletions: 38, merged: true, submittedAt: d("2026-11-12T16:00:00+05:30") },
    { id: "s2", taskId: "t2", milestoneId: "ms4", prUrl: "https://github.com/example/donation-receipts/pull/3", previewUrl: "https://donation-receipts-preview.vercel.app", ciStatus: "pass", testsPassed: 7, testsTotal: 7, commits: 5, additions: 233, deletions: 12, merged: false, submittedAt: d("2026-11-11T18:30:00+05:30") },
  ];

  const reviews: Review[] = [
    {
      id: "r1",
      submissionId: "s1",
      taskId: "t1",
      mentorId: "m1",
      results: [
        { criterionId: "c1", verdict: "pass", comment: "Handles +91 and 10-digit input cleanly. Good error copy." },
        { criterionId: "c2", verdict: "pass", comment: "Tested on the preview with three real numbers." },
        { criterionId: "c3", verdict: "pass", comment: "Opens correctly in Excel and Google Sheets." },
        { criterionId: "c4", verdict: "pass", comment: "Measured 2.1 s in Lighthouse mobile." },
        { criterionId: "c5", verdict: "pass", comment: "Translations checked by NGO staff." },
      ],
      rubric: { codeQuality: 4, communication: 5, timeliness: 4 },
      summary: "Asked the right questions early and shipped a day before the deadline.",
      reviewedAt: d("2026-11-12T20:00:00+05:30"),
    },
  ];

  const acceptances: Acceptance[] = [
    { taskId: "t1", signatoryName: "[Signatory]", acceptedAt: d("2026-11-13T11:00:00+05:30"), previewOpened: true, quote: "[One line from the NGO on what changed]" },
  ];

  return { orgs, people, tasks, matches, submissions, reviews, acceptances, slugs: { t1: "fs-0001" } };
}
