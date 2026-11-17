import { Link } from "react-router-dom";

import { Icon, type IconName } from "~/components/ui/Icon";
import { ScalmintFooter } from "~/components/layout/ScalmintFooter";
import { useContent } from "~/content/ContentProvider";
import { useFavorites } from "~/content/FavoritesProvider";
import { cn } from "~/lib/cn";
import { mediaUrl } from "~/lib/api";

const MENU: { label: string; to: string; icon: IconName; badge?: number }[] = [
  { label: "My Tickets", to: "/tickets", icon: "ticket-stub" },
  { label: "My Events", to: "/profile/events", icon: "calendar" },
  { label: "Favorites", to: "/profile/favorites", icon: "heart" },
  { label: "Notifications", to: "/profile/notifications", icon: "bell", badge: 2 },
  { label: "Settings", to: "/profile/settings", icon: "settings" },
  { label: "Help & Support", to: "/profile/help", icon: "help" },
];

/**
 * Profile: identity, the three wallet stats, the account menu and the
 * notifications card. The stat numbers come from the seeded wallet, so they
 * stay correct when a ticket is bought in the app.
 */
export function ProfileScreen() {
  const { listener, wallet, setNotifications } = useContent();
  // The third stat counts what the listener saved, not how many stations exist.
  const { count: savedCount } = useFavorites();

  return (
    <div className="pb-4">
      <header className="flex items-center gap-3.5 px-5 pt-1.5">
        <img
          src={mediaUrl(listener.avatarUrl)}
          alt={`${listener.name}'s profile photo`}
          className="h-[88px] w-[88px] rounded-full object-cover ring-[2px] ring-surface"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold leading-tight tracking-[-0.025em] text-ink">
            {listener.name}
          </h1>
          <p className="mt-1 truncate text-[13px] leading-snug text-muted">{listener.email}</p>
          <Link
            to="/profile/settings"
            className="mt-1.5 inline-block text-[13px] font-semibold text-brand underline-offset-2 active:underline"
          >
            Edit Profile
          </Link>
        </div>
      </header>

      <dl className="mt-4 flex items-stretch border-t border-b border-line/80">
        <Stat label="Tickets" value={wallet.tickets} />
        <Divider />
        <Stat label="Events" value={wallet.events} />
        <Divider />
        <Stat label="Favorites" value={savedCount} />
      </dl>

      <nav aria-label="Account">
        <ul className="px-5">
          {MENU.map((item) => (
            <li key={item.to} className="border-b border-line/70">
              <Link
                to={item.to}
                className="flex h-[50px] items-center gap-3.5 transition active:opacity-60"
              >
                <Icon name={item.icon} size={19} className="shrink-0 text-[#333c4a]" />
                <span className="flex-1 text-[14.5px] font-medium tracking-[-0.005em] text-ink">
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="grid h-[19px] min-w-[19px] place-items-center rounded-full bg-live px-1 text-[10.5px] font-bold leading-none text-white">
                    {item.badge}
                  </span>
                ) : null}
                <Icon name="chevron-right" size={15} className="shrink-0 text-muted-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mt-5 px-5">
        <div className="flex items-center gap-3 rounded-[4px] border border-line/90 bg-surface/70 p-3 shadow-[0_1px_2px_rgb(23_26_31/0.03)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[4px] bg-brand-soft text-brand">
            <Icon name="bell" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-ink">Get the best of Prototype</p>
            <p className="mt-0.5 text-[11px] leading-[1.35] text-muted">
              Turn on notifications for event updates, new shows and exclusive offers.
            </p>
          </div>
          <Toggle
            checked={listener.notificationsEnabled}
            onChange={setNotifications}
            label="Event and show notifications"
          />
        </div>
      </section>

      <ScalmintFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center py-3.5">
      <dt className="sr-only">{label}</dt>
      <dd className="text-center">
        <span className="block text-[19px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">
          {value}
        </span>
        <span className="mt-2 block text-[12px] font-medium leading-none text-muted">{label}</span>
      </dd>
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="my-2 w-px shrink-0 self-stretch bg-line/80" />;
}

/** Accessible switch: a real checkbox under a styled track, not a clickable div. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex h-[25px] w-[44px] shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      {/* The visual track/thumb never take pointer events: the label owns the
          tap target, so the whole switch is clickable and keyboard-operable via
          the visually hidden checkbox. */}
      <span
        className={cn(
          "pointer-events-none h-full w-full rounded-full transition-colors",
          checked ? "bg-brand" : "bg-line-strong",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-[3px] h-[19px] w-[19px] rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-[19px]",
        )}
      />
    </label>
  );
}
