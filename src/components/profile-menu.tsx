"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logout } from "./session-controls";

export function ProfileMenu({ labels, admin }: {
  labels: { profile: string; view: string; edit: string; moderation: string; logout: string };
  admin: boolean;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        close();
        menu.current.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <details className="profile-menu" ref={menu}>
    <summary>{labels.profile}</summary>
    <div className="profile-menu-panel">
      <Link href="/profile" onClick={close}>{labels.view}</Link>
      <Link href="/profile#edit-profile" onClick={close}>{labels.edit}</Link>
      {admin && <Link href="/admin" onClick={close}>{labels.moderation}</Link>}
      <Logout label={labels.logout} />
    </div>
  </details>;
}
