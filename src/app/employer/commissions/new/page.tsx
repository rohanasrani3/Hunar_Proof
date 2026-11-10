import type { Metadata } from "next";
import { NewCommissionFlow } from "@/components/brief-editor/new-commission-flow";

export const metadata: Metadata = { title: "Commission work" };

export default function NewCommissionPage() {
  return <NewCommissionFlow />;
}
