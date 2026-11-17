import { NavLink, useLocation } from "react-router-dom";

import { cn } from "~/lib/cn";
import { Icon, type IconName } from "~/components/ui/Icon";

/**
 * Five destinations. Live radio is no longer a tab: it is a nested page that
 * opens from any live-radio card (see Home's Up Next rail), so the newsroom
 * takes the second slot.
 */
const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/news", label: "News", icon: "news" },
  { to: "/explore", label: "Events", icon: "explore" },
  { to: "/tickets", label: "Tickets", icon: "ticket" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

/**
 * Bottom tab bar: five destinations, hairline top rule, orange active state.
 *
 * `end` on the Home tab stops "/" matching every route, and the active icon
 * switches to a heavier stroke rather than a second glyph — the mock's active
 * tabs read as bolder, not as a different shape.
 */
export function TabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="relative z-20 shrink-0 border-t border-line/80 bg-paper/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-xl"
    >
      <ul className="flex h-[60px] items-center justify-between px-1.5 pt-1.5 pb-2">
        {TABS.map((tab) => {
          const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
          return (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.to === "/"}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-[5px] rounded-xl px-1 py-1 transition active:scale-[0.96]"
              >
                <Icon
                  name={tab.icon}
                  size={21}
                  filled={active}
                  className={cn(
                    "transition-colors",
                    active ? "text-brand" : "text-[#3c4657] group-active:text-ink",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] leading-none tracking-[0.01em] transition-colors",
                    active ? "font-semibold text-brand" : "font-medium text-muted",
                  )}
                >
                  {tab.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
