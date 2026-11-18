import { BottomNav } from "@/components/flash/BottomNav";

/**
 * The console shell.
 *
 * Business screens leave the social app's rails and top bar behind. On the
 * phone they keep the same bottom tab bar as everywhere else; from `lg` the
 * page supplies its own sidebar. Nothing here can be prerendered — a ticket
 * confirmed at 10:00 must show as confirmed at 10:01.
 */
export const dynamic = "force-dynamic";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      {children}
      <BottomNav />
    </div>
  );
}
