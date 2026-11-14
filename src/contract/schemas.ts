import { z } from "zod";
export const role = z.enum(["customer", "artist"]);
export const category = z.enum(["painting", "music", "dance", "craft"]);
export const short = z.string().trim().min(1).max(120);
export const paragraph = z.string().trim().min(1).max(4000);
export const web = z.url({ protocol: /^https?$/ }).max(2048);
export const email = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
export const password = z.string().min(6).max(128);
export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,40}$/),
  email,
  name: short,
  role,
  password,
});
export const profileSchema = z.object({
  name: short,
  email,
  company: z.string().trim().max(120),
  links: z.array(web).max(8),
  bio: z.string().trim().max(2000).default(""),
  contact: z.string().trim().max(240).default(""),
});
export const commissionSchema = z.object({
  title: short,
  brief: paragraph,
  form: short,
  category,
  otherForm: z.string().max(120).optional(),
  fee: z.coerce.number().int().min(0).max(100000000),
  output_type: z.enum(["audio", "video", "live", "physical", "image", "other"]),
  deadline: z.iso.date(),
});
export type Role = z.infer<typeof role>;
export interface Account {
  id: string;
  username: string;
  name: string;
  email: string;
  company: string;
  links: string;
  photo: string;
  role: Role | "admin";
  session_version: number;
  sample: number;
  revision: number;
  bio: string;
  contact: string;
  deleted: number;
}
export interface Form {
  id: string;
  name: string;
  hi: string;
  category: z.infer<typeof category>;
}
export interface Commission {
  id: string;
  title: string;
  brief: string;
  form: string;
  fee: number;
  status: "finding" | "progress" | "done";
  customer: string;
  customer_name: string;
  customer_username: string;
  artist: string | null;
  sample: number;
  paused: number;
  published: number;
  output: string;
  output_type: "audio" | "video" | "live" | "physical" | "image" | "other";
  reference: string;
  deadline: string;
  original_fee: number;
  created: number;
  updated: number;
  selected_at: number;
  submitted_at: number;
  accepted_at: number;
  customer_contact: string;
  artist_name: string | null;
  artist_username: string | null;
  artist_contact: string | null;
}
export interface Proposal {
  id: string;
  artist: string;
  name: string;
  username: string;
  contact: string;
  message: string;
  quote: number;
  initial_quote: number;
  pricing: "offered" | "quote";
  created: number;
  updated: number;
  status: "active" | "cancelled";
}
export interface Work {
  id: string;
  title: string;
  url: string;
  form: string;
}
