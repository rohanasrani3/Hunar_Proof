"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNavigation({ hi }: { hi: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/talent", label: hi ? "कलाकार खोजें" : "Find artists", active: pathname.startsWith("/talent") || pathname.startsWith("/people") },
    { href: "/commissions", label: hi ? "कमीशन देखें" : "Find work", active: pathname.startsWith("/commissions") },
    { href: "/impact", label: hi ? "प्रभाव" : "Our impact", active: pathname === "/impact" },
  ];
  return <nav className="header-center" aria-label={hi ? "मुख्य मेनू" : "Main navigation"}>{links.map((link) => <Link key={link.href} href={link.href} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}</nav>;
}
