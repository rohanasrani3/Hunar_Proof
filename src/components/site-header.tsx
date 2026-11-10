import Link from "next/link";
import { Logo } from "./icons";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Logo />
          <span className="font-serif text-[22px] font-semibold tracking-tight">Hunar Proof</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-5 text-[15px] sm:gap-6">
          <Link href="/talent" className="text-ink-2 hover:text-ink">Find artists</Link>
          <Link href="/impact" className="text-ink-2 hover:text-ink">Impact</Link>
          <Link
            href="/employer/commissions/new"
            className="rounded-full bg-ink px-4 py-2.5 font-medium text-paper transition-colors hover:bg-indigo-deep"
          >
            Commission work
          </Link>
        </nav>
      </div>
    </header>
  );
}
