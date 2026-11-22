"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileControl } from "@/components/auth/ProfileControl";
import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { Sheet } from "@/components/flash/Sheet";
import type { AdminIdentity } from "@/lib/admin/auth";
import { ADMIN_GROUPS, adminHref } from "@/lib/admin/navigation";
import type { FlashUser } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

const ROW =
  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] transition-colors";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {ADMIN_GROUPS.map((group) => (
        <div key={group.label} className="mt-6 first:mt-0">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
            {group.label}
          </p>
          <nav aria-label={group.label} className="mt-1.5 flex flex-col gap-1">
            {group.sections.map((section) => {
              const href = adminHref(section.path);
              const active = pathname === href;

              return (
                <Link
                  key={section.path}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ROW,
                    active
                      ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgb(23_26_31/0.05)]"
                      : "font-medium text-muted hover:bg-surface-2/70 hover:text-ink",
                  )}
                >
                  <Icon
                    name={section.icon}
                    size={19}
                    className={cn("shrink-0", active ? "text-brand" : "text-icon-idle")}
                  />
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </>
  );
}

function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const matches = ADMIN_GROUPS.flatMap((group) => group.sections).filter((section) =>
    section.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="relative w-full max-w-[300px]">
      <div className="flex h-10 items-center gap-2 rounded-[11px] border border-line bg-paper px-3 focus-within:border-brand/50">
        <Icon name="search" size={16} className="shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search admin"
          aria-label="Search admin"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      {query.trim() ? (
        <div className="absolute left-0 right-0 top-11 z-30 rounded-[12px] border border-line bg-surface p-1.5 shadow-raised">
          {matches.length ? (
            matches.map((section) => (
              <button
                key={section.path}
                type="button"
                onClick={() => {
                  router.push(adminHref(section.path));
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-ink-soft hover:bg-surface-2"
              >
                <Icon name={section.icon} size={16} />
                {section.label}
              </button>
            ))
          ) : (
            <p className="px-2.5 py-2 text-[12.5px] text-muted">No matching section.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AdminShell({
  identity,
  children,
}: {
  identity: AdminIdentity;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const accountUser: FlashUser = {
    id: identity.id,
    name: identity.name,
    email: identity.email,
    avatarUrl: identity.avatarUrl,
    memberSince: "",
    notificationsEnabled: false,
  };

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="no-print sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col border-r border-line/70 px-4 py-5 lg:flex">
        <Link href="/" className="px-2" aria-label="Flash — home">
          <FlashLogo size="sm" />
        </Link>

        <div className="mt-8 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="mt-auto border-t border-line/70 pt-4">
          <div className="flex items-center gap-3 rounded-[12px] px-2 py-2">
            <ProfileControl user={accountUser} variant="row" />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold text-ink">
                {identity.name}
              </span>
              <span className="block truncate text-[12px] text-muted">Manage account</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-paper/95 px-5 py-3 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink lg:hidden"
          >
            <Icon name="menu" size={19} />
          </button>

          <SearchBox />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/admin/approvals"
              aria-label="Pending approvals"
              className="grid h-10 w-10 place-items-center rounded-full text-icon-idle transition-colors hover:bg-surface-2"
            >
              <Icon name="bell" size={19} />
            </Link>
            <ProfileControl user={accountUser} size={36} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-6 lg:px-8">
          {children}
        </main>
      </div>

      {menuOpen ? (
        <Sheet title="Admin" onClose={() => setMenuOpen(false)}>
          <div className="flex items-center gap-3 border-b border-line/80 pb-4">
            <ProfileControl user={accountUser} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{identity.name}</p>
              <p className="truncate text-[12px] text-muted">{identity.email}</p>
            </div>
          </div>
          <div className="pt-4">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
