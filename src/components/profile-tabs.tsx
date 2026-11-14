import Link from "next/link";
import "./profile.css";

export function ProfileTabs({ artist, active, hi, unread = 0 }: {
  artist: boolean;
  active: "personal" | "portfolio" | "history" | "security";
  hi: boolean;
  unread?: number;
}) {
  const tabs = [
    { id: "personal", href: "/profile", label: hi ? "व्यक्तिगत जानकारी" : "Personal information" },
    ...(artist ? [{ id: "portfolio", href: "/profile?tab=portfolio", label: hi ? "पोर्टफ़ोलियो" : "Portfolio" }] : []),
    { id: "history", href: "/profile/history", label: hi ? "कार्य इतिहास" : "Work history" },
    { id: "security", href: "/profile?tab=security", label: hi ? "सुरक्षा" : "Security" },
  ];
  return <nav className="profile-tabs" aria-label={hi ? "प्रोफ़ाइल अनुभाग" : "Profile sections"}>
    {tabs.map((tab) => <Link key={tab.id} href={tab.href} aria-current={active === tab.id ? "page" : undefined}>
      {tab.label}{tab.id === "history" && unread > 0 && <span className="notification-count" aria-label={hi ? `${unread} नए अपडेट` : `${unread} unread updates`}>{unread > 99 ? "99+" : unread}</span>}
    </Link>)}
  </nav>;
}
