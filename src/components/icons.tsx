import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...rest,
});

export function CheckCircle({ size = 24, strokeWidth = 2.4, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </svg>
  );
}

/** Check whose tick draws itself in — used for the "verified" reveal. */
export function CheckCircleDraw({ size = 24, strokeWidth = 2.4, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-6.5" strokeDasharray="24" className="animate-draw" />
    </svg>
  );
}

export function AlertCircle({ size = 24, strokeWidth = 2.4, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

export function Sparkle({ size = 16, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    </svg>
  );
}

export function Pencil({ size = 18, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function Trash({ size = 18, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function ChevronLeft({ size = 22, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ArrowUpRight({ size = 16, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

/** Hunar Proof mark: a kolam-style dot grid inside a seal, one stroke looping through it. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" stroke="var(--color-indigo)" strokeWidth="2" />
      <path
        d="M14 6.5c3 0 4 2.5 4 4s2.5 3.5 2.5 3.5-2.5 2-2.5 3.5-1 4-4 4-4-2.5-4-4-2.5-3.5-2.5-3.5 2.5-2 2.5-3.5 1-4 4-4z"
        stroke="var(--color-saffron)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="10.5" r="1.3" fill="var(--color-indigo)" />
      <circle cx="10.5" cy="14" r="1.3" fill="var(--color-indigo)" />
      <circle cx="17.5" cy="14" r="1.3" fill="var(--color-indigo)" />
      <circle cx="14" cy="17.5" r="1.3" fill="var(--color-indigo)" />
    </svg>
  );
}

export function Play({ size = 18, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={2}>
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

export function Speaker({ size = 18, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
      <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
    </svg>
  );
}

export function MapPin({ size = 16, strokeWidth = 2, ...rest }: P) {
  return (
    <svg {...base(size, rest)} strokeWidth={strokeWidth}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
