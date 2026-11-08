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

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="7" stroke="var(--color-indigo)" strokeWidth="2" />
      <path d="M8 17l6-8 6 8" stroke="var(--color-saffron)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 21h12" stroke="var(--color-indigo)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
