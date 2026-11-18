import Link from "next/link";

import { Icon } from "@/components/flash/Icon";
import { CONSOLE_SECTIONS, consoleHref, type ConsoleKind } from "@/lib/flash/console";

/** The overview's short route into each section of this business. */
export function ConsoleSectionLinks({
  kind,
  businessId,
}: {
  kind: ConsoleKind;
  businessId: string;
}) {
  const sections = CONSOLE_SECTIONS[kind].filter((section) => section.path);

  return (
    <section className="mt-8">
      <h2 className="text-[16px] font-bold tracking-[-0.015em] text-ink">Sections</h2>
      <p className="mt-1 text-[13px] leading-snug text-muted">
        Each part of this console has its own page.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.path}
            href={consoleHref(kind, businessId, section.path)}
            className="flex items-center gap-3 rounded-[14px] border border-line/90 bg-surface px-3.5 py-3 transition hover:border-line-strong"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-surface-2 text-icon-idle">
              <Icon name={section.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
              {section.label}
            </span>
            <Icon name="chevron-right" size={16} className="shrink-0 text-muted-soft" />
          </Link>
        ))}
      </div>
    </section>
  );
}
