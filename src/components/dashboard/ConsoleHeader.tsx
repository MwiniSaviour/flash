import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { CONSOLE_LABEL, type ConsoleKind } from "@/lib/flash/console";
import type { Business } from "@/lib/flash/types";

import { ConsoleMobileNav } from "./ConsoleMobileNav";

/**
 * The console page heading.
 *
 * It stays a server component so the business name and the storefront link are
 * rendered with the page. The drawer trigger is the one client island in it.
 */
export function ConsoleHeader({
  kind,
  title,
  linkHref,
  linkLabel,
  businesses,
  currentId,
}: {
  kind: ConsoleKind;
  title: string;
  linkHref: string;
  linkLabel: string;
  businesses: Business[];
  currentId: string;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-muted">{CONSOLE_LABEL[kind]}</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        <Link
          href={linkHref}
          className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand-ink transition-colors hover:text-brand"
        >
          {linkLabel}
          <Icon name="chevron-right" size={13} />
        </Link>
      </div>
      <ConsoleMobileNav kind={kind} businesses={businesses} currentId={currentId} />
    </header>
  );
}
