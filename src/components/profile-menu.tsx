"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Logout } from "./session-controls";

export function ProfileMenu({ labels, admin, artist = false, unread = 0 }: {
  labels: { profile: string; view?: string; edit?: string; portfolio?: string; history?: string; security?: string; moderation: string; logout: string };
  admin: boolean;
  artist?: boolean;
  unread?: number;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const close = () => { if (menu.current) menu.current.open = false; };
  useEffect(close, [pathname]);
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) close(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) { close(); menu.current.querySelector("summary")?.focus(); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, []);
  return <details className="profile-menu" ref={menu}>
    <summary>{labels.profile}{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}</summary>
    <div className="profile-menu-panel">
      <Link href="/profile" onClick={close}>{labels.profile}</Link>
      {artist && <Link href="/profile?tab=portfolio" onClick={close}>{labels.portfolio ?? "Portfolio"}</Link>}
      <Link href="/profile/history" onClick={close}>{labels.history ?? "Work history"}{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}</Link>
      <Link href="/profile?tab=security" onClick={close}>{labels.security ?? "Security"}</Link>
      {admin && <Link href="/admin" onClick={close}>{labels.moderation}</Link>}
      <Logout label={labels.logout} />
    </div>
  </details>;
}
