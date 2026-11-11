import type { ReactNode } from "react";

export const SOCIALS = [
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"] },
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  { key: "x", label: "X", hosts: ["x.com", "twitter.com"] },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];

export function socialKey(url: string): SocialKey | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SOCIALS.find((site) =>
      site.hosts.some((domain) => host === domain || host.endsWith("." + domain)),
    )?.key;
  } catch {
    return undefined;
  }
}

export function SocialIcon({ name }: { name: SocialKey }) {
  const shapes: Record<SocialKey, ReactNode> = {
    linkedin: (
      <>
        <rect x="3" y="8" width="4" height="13" fill="currentColor" />
        <circle cx="5" cy="4.5" r="2" fill="currentColor" />
        <path d="M11 21V8h4v2c.8-1.4 2-2.2 3.6-2.2 2.8 0 4.4 1.8 4.4 5.3V21h-4v-7.2c0-1.6-.5-2.4-1.8-2.4-1.5 0-2.2 1.1-2.2 2.8V21z" fill="currentColor" />
      </>
    ),
    instagram: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="2.3" />
        <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="2.3" />
        <circle cx="17.8" cy="6.3" r="1.2" fill="currentColor" />
      </>
    ),
    facebook: (
      <path d="M14.5 22v-8.3h3l.5-3.7h-3.5V7.7c0-1.1.4-1.8 1.9-1.8H18V2.6c-.7-.1-1.6-.2-2.8-.2-3.1 0-5.1 1.9-5.1 5.3V10H7v3.7h3.1V22z" fill="currentColor" />
    ),
    x: (
      <path d="M3 3h4.3L21 21h-4.3L3 3Zm18 0-7.2 8.1M3 21l7.2-8.1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    ),
    youtube: (
      <>
        <rect x="1.5" y="5" width="21" height="14" rx="4" stroke="currentColor" strokeWidth="2.2" />
        <path d="m10 9 6 3-6 3z" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      {shapes[name]}
    </svg>
  );
}

export function SocialLinks({ links }: { links: string[] }) {
  const recognized = links.map((url) => ({ url, key: socialKey(url) })).filter((item) => item.key);
  const other = links.filter((url) => !socialKey(url));
  return (
    <>
      {recognized.length > 0 && (
        <div className="social-links">
          {recognized.map(({ url, key }) => (
            <a key={url} href={url} target="_blank" rel="me noreferrer noopener" aria-label={SOCIALS.find((site) => site.key === key)?.label} title={SOCIALS.find((site) => site.key === key)?.label}>
              <SocialIcon name={key!} />
            </a>
          ))}
        </div>
      )}
      {other.map((url) => (
        <p key={url}><a href={url} target="_blank" rel="me noreferrer noopener">{url}</a></p>
      ))}
    </>
  );
}
