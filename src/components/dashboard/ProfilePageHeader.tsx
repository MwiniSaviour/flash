import Link from "next/link";

import { Icon } from "@/components/flash/Icon";

/** The header shared by every account sub-page. */
export function ProfilePageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-line/70 px-5 pb-4 pt-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-ink"
      >
        <Icon name="chevron-left" size={14} />
        Profile
      </Link>
      <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.025em] text-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-[13px] leading-snug text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}
