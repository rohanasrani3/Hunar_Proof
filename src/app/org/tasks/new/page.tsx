import type { Metadata } from "next";
import { NewTaskFlow } from "@/components/spec-editor/new-task-flow";

export const metadata: Metadata = { title: "Post a task" };

export default function NewTaskPage() {
  return <NewTaskFlow />;
}
