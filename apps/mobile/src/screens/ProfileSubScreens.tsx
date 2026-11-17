import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { BackButton } from "~/components/layout/BackButton";
import { Tag } from "~/components/ui/primitives";
import { Toggle } from "~/screens/ProfileScreen";
import { useContent } from "~/content/ContentProvider";
import { useFavorites } from "~/content/FavoritesProvider";
import { ScalmintFooter } from "~/components/layout/ScalmintFooter";
import { findArticle } from "~/lib/news";
import { mediaUrl } from "~/lib/api";
import { cedis, dateBadge, timeAgo } from "~/lib/format";

/**
 * The account menu's destinations. None of them appears in the mock beyond the
 * menu rows, so each one reuses the established type scale, cards and spacing
 * instead of inventing a new visual language.
 */

function SubScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-start gap-2 px-5 pt-2">
      <BackButton tone="dark" onClick={() => navigate(-1)} label="Back" />
      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.014em] text-ink">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}

export function MyEventsScreen() {
  const navigate = useNavigate();
  const { tickets, getEventForTicket } = useContent();
  const rows = tickets
    .map((ticket) => ({ ticket, event: getEventForTicket(ticket) }))
    .filter((row) => row.event);

  return (
    <div className="pb-6">
      <SubScreenHeader title="My Events" subtitle={`${rows.length} events in your wallet.`} />
      <ul className="mt-4 space-y-2.5 px-3.5">
        {rows.map(({ ticket, event }) => {
          if (!event) return null;
          const badge = dateBadge(event.date);
          return (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => navigate(`/events/${event.slug}`)}
                className="flex w-full items-center gap-3.5 rounded-[5px] border border-line/90 bg-surface/70 p-2.5 text-left transition active:scale-[0.99]"
              >
                <span className="block h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[4px] bg-media">
                  <img
                    src={mediaUrl(event.image.src)}
                    alt={event.image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold text-ink">{event.title}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {badge.weekday} {badge.day} {badge.month} · {event.venue}
                  </span>
                  <span className="mt-1 block text-[12px] text-muted-soft">
                    {ticket.quantity} × {ticket.tierName} · {cedis(event.priceFrom)}
                  </span>
                </span>
                <Icon name="chevron-right" size={16} className="text-muted-soft" />
              </button>
            </li>
          );
        })}
      </ul>
      <ScalmintFooter />
    </div>
  );
}

export function FavoritesScreen() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const { getEvent } = useContent();

  // Resolve each saved item against the same fixtures/CMS the rest of the app
  // reads, so a favourite is a pointer, never a second copy of the content.
  const rows = favorites
    .map((favorite) => {
      if (favorite.kind === "news") {
        const article = findArticle(favorite.slug);
        return article
          ? {
              favorite,
              title: article.title,
              meta: `${article.category.name} · ${timeAgo(article.publishedAt)}`,
              art: article.image,
              to: `/news/${article.slug}`,
              badge: "Story",
            }
          : null;
      }
      const event = getEvent(favorite.slug);
      return event
        ? {
            favorite,
            title: event.title,
            meta: `${event.venue}, ${event.city}`,
            art: event.image,
            to: `/events/${event.slug}`,
            badge: "Event",
          }
        : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <div className="pb-2">
      <SubScreenHeader
        title="Favorites"
        subtitle={
          rows.length
            ? `${rows.length} saved ${rows.length === 1 ? "item" : "items"} — stories and events.`
            : "Stories and events you save show up here."
        }
      />

      {rows.length === 0 ? (
        <div className="mx-5 mt-5 rounded-[5px] border border-dashed border-line-strong/70 px-4 py-9 text-center">
          <Icon name="heart" size={20} className="mx-auto text-muted-soft" />
          <p className="mt-2 text-[13px] font-semibold text-ink">Nothing saved yet</p>
          <p className="mt-1 text-[12px] leading-snug text-muted">
            Tap the heart on a story or an event to keep it here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2 px-3.5">
          {rows.map((row) => (
            <li key={`${row.favorite.kind}:${row.favorite.slug}`}>
              <div className="flex items-center gap-3.5 rounded-[5px] border border-line/90 bg-surface/70 p-2.5">
                <button
                  type="button"
                  onClick={() => navigate(row.to)}
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left transition active:scale-[0.99]"
                >
                  <span className="block h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[4px] bg-media">
                    <img
                      src={mediaUrl(row.art.src)}
                      alt={row.art.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
                      {row.badge}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[13.5px] font-semibold leading-snug text-ink">
                      {row.title}
                    </span>
                    <span className="mt-1 block truncate text-[11.5px] text-muted">{row.meta}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite(row.favorite.kind, row.favorite.slug)}
                  aria-label={`Remove ${row.title} from favorites`}
                  aria-pressed="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-95"
                >
                  <Icon name="heart" size={17} filled className="text-brand" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ScalmintFooter />
    </div>
  );
}

export function NotificationsScreen() {
  const { listener, setNotifications } = useContent();
  const items = [
    { title: "Event updates", body: "Line-up changes, gate times and cancellations.", on: true },
    { title: "New shows", body: "When a new programme joins the schedule.", on: true },
    { title: "Exclusive offers", body: "Early ticket windows for Prototype events.", on: false },
  ];

  return (
    <div className="pb-6">
      <SubScreenHeader title="Notifications" subtitle="Choose what Prototype can tell you about." />
      <ul className="mt-4 space-y-2 px-3.5">
        <li className="flex items-center gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] bg-brand-soft text-brand">
            <Icon name="bell" size={18} />
          </span>
          <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink">Push notifications</span>
          <Toggle
            checked={listener.notificationsEnabled}
            onChange={setNotifications}
            label="Push notifications"
          />
        </li>
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 rounded-[5px] border border-line/90 bg-surface/70 p-3.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-ink">{item.title}</span>
              <span className="mt-1 block text-[11.5px] leading-snug text-muted">{item.body}</span>
            </span>
            <Tag>{item.on ? "On" : "Off"}</Tag>
          </li>
        ))}
      </ul>
      <p className="mx-5 mt-4 text-[11.5px] leading-snug text-muted-soft">
        Preferences are stored on this device. Push delivery is enabled by the Capacitor shell once a
        notification provider is configured.
      </p>
      <ScalmintFooter />
    </div>
  );
}

export function SettingsScreen() {
  const { listener, source } = useContent();
  const rows = [
    { label: "Name", value: listener.name },
    { label: "Email", value: listener.email },
    { label: "Content source", value: source === "cms" ? "Payload CMS" : "Seeded fixtures" },
    { label: "App version", value: "0.1.0" },
  ];

  return (
    <div className="pb-6">
      <SubScreenHeader title="Settings" subtitle="Your account and app details." />
      <ul className="mx-5 mt-4 divide-y divide-line/70 rounded-[5px] border border-line/90 bg-surface/70">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 px-3.5 py-3">
            <span className="text-[13px] text-muted">{row.label}</span>
            <span className="truncate text-[13px] font-semibold text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mx-5 mt-3 text-[11.5px] leading-snug text-muted-soft">
        Account editing arrives with listener auth; this build signs in as the seeded demo listener.
      </p>
      <ScalmintFooter />
    </div>
  );
}

export function HelpScreen() {
  const faqs = [
    {
      q: "How do I listen live?",
      a: "Tap the play button on Home or pick any station in Live. Audio starts over the station's stream.",
    },
    {
      q: "Where are my tickets?",
      a: "Every order lands in the Tickets tab immediately after you buy, even with no signal.",
    },
    {
      q: "A stream won't start",
      a: "The station may have no stream configured in the CMS yet. The player tells you when that is the case.",
    },
  ];

  return (
    <div className="pb-6">
      <SubScreenHeader title="Help & Support" subtitle="Answers to the usual questions." />
      <ul className="mt-4 space-y-2 px-3.5">
        {faqs.map((faq) => (
          <li key={faq.q} className="rounded-[5px] border border-line/90 bg-surface/70 p-3.5">
            <p className="text-[13.5px] font-semibold text-ink">{faq.q}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{faq.a}</p>
          </li>
        ))}
      </ul>
      <div className="mx-3.5 mt-3 rounded-[5px] bg-brand-soft/60 p-3.5">
        <p className="text-[13px] font-semibold text-ink">Still stuck?</p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          Email <span className="font-semibold text-brand">support@prototype.fm</span> and the team
          will get back to you within one working day, or call{" "}
          <span className="font-semibold text-brand tabular-nums">052703858</span>.
        </p>
      </div>
      <ScalmintFooter />
    </div>
  );
}
