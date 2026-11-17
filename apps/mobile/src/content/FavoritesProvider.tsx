import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Saved items — the "favourites" the profile counts.
 *
 * There is no account server in this build, so favourites live on the device
 * (the same place the wallet keeps its local purchases). A favourite is stored
 * as a kind plus slug pair, which is enough to resolve the full record from the
 * shared fixtures or the CMS at render time, and keeps the stored payload tiny.
 */
export type FavoriteKind = "news" | "event";

export interface Favorite {
  kind: FavoriteKind;
  slug: string;
  /** ISO timestamp, newest first in every list. */
  savedAt: string;
}

interface FavoritesState {
  favorites: Favorite[];
  count: number;
  isFavorite: (kind: FavoriteKind, slug: string) => boolean;
  toggleFavorite: (kind: FavoriteKind, slug: string) => void;
  removeFavorite: (kind: FavoriteKind, slug: string) => void;
}

const STORAGE_KEY = "prototype-radio-favorites-v1";

/**
 * A prototype profile is never empty: these three ship saved so the screen and
 * the "Favorites" stat read as a real library from the first launch. Slugs come
 * straight from the shared fixtures, so they always resolve.
 */
const SEED: Favorite[] = [
  { kind: "event", slug: "sunset-live-sessions", savedAt: "2026-10-22T19:20:00.000Z" },
  { kind: "news", slug: "jambia-pumping-station-failure-water-rationing", savedAt: "2026-10-20T08:05:00.000Z" },
  { kind: "news", slug: "harmattan-arrives-visibility-flights-drive-warning", savedAt: "2026-10-18T06:40:00.000Z" },
];

function readFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return SEED;
    return parsed
      .filter(
        (item): item is Favorite =>
          Boolean(item) &&
          typeof (item as Favorite).slug === "string" &&
          typeof (item as Favorite).savedAt === "string" &&
          ((item as Favorite).kind === "news" || (item as Favorite).kind === "event"),
      )
      .slice()
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return SEED;
  }
}

function writeFavorites(favorites: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // A private-mode WebView can refuse the write; the session keeps the state
    // in memory, and losing a favourite is not worth an error screen.
  }
}

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>(readFavorites);

  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  const isFavorite = useCallback(
    (kind: FavoriteKind, slug: string) =>
      favorites.some((item) => item.kind === kind && item.slug === slug),
    [favorites],
  );

  const toggleFavorite = useCallback((kind: FavoriteKind, slug: string) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.kind === kind && item.slug === slug);
      if (exists) return current.filter((item) => !(item.kind === kind && item.slug === slug));
      return [{ kind, slug, savedAt: new Date().toISOString() }, ...current];
    });
  }, []);

  const removeFavorite = useCallback((kind: FavoriteKind, slug: string) => {
    setFavorites((current) => current.filter((item) => !(item.kind === kind && item.slug === slug)));
  }, []);

  const value = useMemo<FavoritesState>(
    () => ({ favorites, count: favorites.length, isFavorite, toggleFavorite, removeFavorite }),
    [favorites, isFavorite, removeFavorite, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesState {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}
