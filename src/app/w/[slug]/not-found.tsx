import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-4 py-24 text-center sm:px-8">
        <h1 className="font-serif text-4xl font-semibold">No verified work here</h1>
        <p className="mt-4 text-ink-2">
          This link doesn’t match any verified work. It may have been mistyped, or the employer hasn’t accepted the work yet.
        </p>
        <Link href="/" className="mt-8 inline-block font-medium text-indigo">← Back to Hunar Proof</Link>
      </main>
    </>
  );
}
