import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/50 ring-1 ring-white/15">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M5 7h14L5 17h14"
            stroke="#e8c36a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {compact ? null : (
        <span className="font-display text-sm font-semibold tracking-[0.18em]">
          ZEE MEDIA
        </span>
      )}
    </Link>
  );
}
