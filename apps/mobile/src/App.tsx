import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { TabBar } from "~/components/layout/TabBar";
import { ContentProvider } from "~/content/ContentProvider";
import { FavoritesProvider } from "~/content/FavoritesProvider";
import { PlayerProvider, usePlayer } from "~/content/PlayerProvider";
import { ExploreScreen } from "~/screens/ExploreScreen";
import { EventDetailScreen } from "~/screens/EventDetailScreen";
import { HomeScreen } from "~/screens/HomeScreen";
import { ArticleScreen } from "~/screens/ArticleScreen";
import { LiveScreen } from "~/screens/LiveScreen";
import { ScheduleScreen } from "~/screens/ScheduleScreen";
import { NewsScreen } from "~/screens/NewsScreen";
import { OnboardingScreen } from "~/screens/OnboardingScreen";
import { ProfileScreen } from "~/screens/ProfileScreen";
import {
  FavoritesScreen,
  HelpScreen,
  MyEventsScreen,
  NotificationsScreen,
  SettingsScreen,
} from "~/screens/ProfileSubScreens";
import { SearchScreen } from "~/screens/SearchScreen";
import { TicketsScreen } from "~/screens/TicketsScreen";

/**
 * Routes that keep the tab bar. The onboarding flow, the event detail page and
 * the account sub-pages are full-screen pushes — exactly what the mock shows
 * (no tab bar on the event page).
 */
const TAB_ROUTES = ["/", "/news", "/explore", "/tickets", "/profile", "/search"];
/**
 * Pushes over the tab bar. Live radio is one of them: it opens from a live
 * radio card (Home → Up Next) rather than from a tab, and a story opens the
 * reader the same way.
 */
const FULLSCREEN_ROUTES = ["/events/", "/news/", "/live"];

function Shell() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // One global live region: the player can be started from Home, Live or
  // Explore, so playback state has to be announced wherever the listener is.
  const { status } = usePlayer();

  const path = location.pathname;
  const isOnboarding = path === "/welcome";
  const showTabs =
    TAB_ROUTES.includes(path) || (!isOnboarding && !FULLSCREEN_ROUTES.some((p) => path.startsWith(p)));

  // Native-style route change: new screen starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [path]);

  return (
    <div className="device-stage flex flex-col">
      {isOnboarding ? (
        <Routes>
          <Route path="/welcome" element={<OnboardingScreen />} />
        </Routes>
      ) : (
        <>
          {/* No drawn status bar: the OS owns that strip. On device the inset
              below keeps content clear of it; in the browser it is simply zero. */}
          <div className="safe-top shrink-0" />
          <main
            ref={scrollRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain pt-1.5"
          >
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/news" element={<NewsScreen />} />
              <Route path="/news/:slug" element={<ArticleScreen />} />
              <Route path="/live" element={<LiveScreen />} />
              <Route path="/live/schedule" element={<ScheduleScreen />} />
              <Route path="/explore" element={<ExploreScreen />} />
              <Route path="/tickets" element={<TicketsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/events" element={<MyEventsScreen />} />
              <Route path="/profile/favorites" element={<FavoritesScreen />} />
              {/* The old "Your Station" address still resolves for anyone with it saved. */}
              <Route path="/profile/stations" element={<FavoritesScreen />} />
              <Route path="/profile/notifications" element={<NotificationsScreen />} />
              <Route path="/profile/settings" element={<SettingsScreen />} />
              <Route path="/profile/help" element={<HelpScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/events/:slug" element={<EventDetailScreen />} />
              <Route path="*" element={<HomeScreen />} />
            </Routes>
          </main>
          <p aria-live="polite" role="status" className="sr-only">
            {status}
          </p>
          {showTabs ? <TabBar /> : null}
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <ContentProvider>
      <FavoritesProvider>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </FavoritesProvider>
    </ContentProvider>
  );
}
