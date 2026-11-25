"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { getBestDevicePosition } from "@/components/flash/device-location";
import type { GeoPoint } from "@/lib/flash/geo";
import {
  clearLocationCookie,
  getCitySnapshot,
  getServerCitySnapshot,
  getServerStatusSnapshot,
  getStatusSnapshot,
  parseCity,
  publishCity,
  publishStatus,
  readCachedLocation,
  subscribeLocation,
  writeCachedLocation,
  type LocationStatus,
} from "@/lib/flash/location";
import { reverseCity } from "@/lib/flash/places";

/**
 * Location for the storefront.
 *
 * The cached city answers on first render; a background device check follows
 * and refreshes the server-rendered lists when the city changes. A denial
 * keeps the cached city (or shows every area when there is none).
 */

type LocationValue = {
  city: string | null;
  point: GeoPoint | null;
  status: LocationStatus;
  refresh: () => void;
};

const LocationContext = createContext<LocationValue>({
  city: null,
  point: null,
  status: "loading",
  refresh: () => {},
});

export function useLocation(): LocationValue {
  return useContext(LocationContext);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const city = useSyncExternalStore(
    subscribeLocation,
    getCitySnapshot,
    getServerCitySnapshot,
  );
  const status = useSyncExternalStore(
    subscribeLocation,
    getStatusSnapshot,
    getServerStatusSnapshot,
  );
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const lastCity = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const position = await getBestDevicePosition();
      const nextPoint = position.point;
      const nextCity = parseCity(await reverseCity(nextPoint));

      setPoint(nextPoint);
      publishCity(nextCity);
      publishStatus("ready");

      writeCachedLocation({
        city: nextCity,
        point: nextPoint,
        accuracy: position.usable ? position.accuracy : null,
        at: Date.now(),
      });

      if (lastCity.current !== nextCity) {
        lastCity.current = nextCity;
        router.refresh();
      }
    } catch {
      publishStatus(lastCity.current ? "cached" : "denied");
      if (!lastCity.current) clearLocationCookie();
    }
  }, [router]);

  const refresh = useCallback(() => {
    lastCity.current = null;
    void check();
  }, [check]);

  useEffect(() => {
    const cached = readCachedLocation();
    if (cached?.city) {
      lastCity.current = cached.city;
      publishCity(cached.city);
      publishStatus("cached");
    }
    queueMicrotask(() => {
      void check();
    });
  }, [check]);

  return (
    <LocationContext.Provider value={{ city, point, status, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}
