export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r="12.5"
        stroke="var(--color-indigo)"
        strokeWidth="2"
      />
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
