import type { GeoPoint } from "@/lib/flash/geo";

/** A fix coarser than this is not usable for a pickup or a fare. */
export const MAX_USABLE_ACCURACY_M = 100;

/** How long watchPosition is allowed to refine the fix before we use the best sample. */
export const WATCH_SAMPLE_MS = 8000;

export type DevicePosition = {
  point: GeoPoint;
  accuracy: number;
  usable: boolean;
  coarse: boolean;
};

export type DeviceCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type WatchOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

type NativeGeolocation = {
  getCurrentPosition?: (options?: WatchOptions) => Promise<{ coords: DeviceCoords }>;
  watchPosition?: (
    onSuccess: (position: { coords: DeviceCoords }) => void,
    onError?: (error: unknown) => void,
    options?: WatchOptions,
  ) => number;
  clearWatch?: (id: number) => void;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { Geolocation?: NativeGeolocation };
};

type Watcher = {
  watch: (onSample: (coords: DeviceCoords) => void, options: WatchOptions) => number;
  clear: (id: number) => void;
};

function nativeGeolocation(): NativeGeolocation | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.Geolocation ?? null;
}

export function positionFromCoords(coords: DeviceCoords): DevicePosition {
  const accuracy = coords.accuracy ?? Number.POSITIVE_INFINITY;

  return {
    point: { lat: coords.latitude, lng: coords.longitude },
    accuracy,
    usable: accuracy <= MAX_USABLE_ACCURACY_M,
    coarse: accuracy > MAX_USABLE_ACCURACY_M,
  };
}

/** The most accurate fix from a stream of watchPosition samples. */
export function bestFix(fixes: DevicePosition[]): DevicePosition | null {
  return fixes.reduce<DevicePosition | null>(
    (best, fix) => (!best || fix.accuracy < best.accuracy ? fix : best),
    null,
  );
}

function nativeWatcher(): Watcher | null {
  const native = nativeGeolocation();
  if (!native) return null;

  if (native.watchPosition) {
    return {
      watch: (onSample, options) =>
        native.watchPosition!((position) => onSample(position.coords), undefined, options),
      clear: (id) => native.clearWatch?.(id),
    };
  }

  if (native.getCurrentPosition) {
    let cancelled = false;
    return {
      watch: (onSample, options) => {
        const poll = () => {
          void native.getCurrentPosition!(options).then(
            (position) => {
              if (!cancelled) onSample(position.coords);
            },
            () => {},
          );
        };
        poll();
        return window.setInterval(poll, 1000);
      },
      clear: (id) => {
        cancelled = true;
        window.clearInterval(id);
      },
    };
  }

  return null;
}

function browserWatcher(): Watcher | null {
  if (typeof navigator === "undefined" || !navigator.geolocation?.watchPosition) return null;

  return {
    watch: (onSample, options) =>
      navigator.geolocation.watchPosition(
        (position) => onSample(position.coords),
        undefined,
        options,
      ),
    clear: (id) => navigator.geolocation.clearWatch(id),
  };
}

function collectBestFix(watcher: Watcher, sampleMs: number): Promise<DevicePosition> {
  return new Promise<DevicePosition>((resolve, reject) => {
    const samples: DevicePosition[] = [];
    let settled = false;
    let watchId: number | null = null;

    function finish(position: DevicePosition | null, error?: unknown) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (watchId !== null) watcher.clear(watchId);
      if (position) resolve(position);
      else
        reject(
          error instanceof Error
            ? error
            : new Error("Location is unavailable. Type the address instead."),
        );
    }

    const timer = setTimeout(() => finish(bestFix(samples)), sampleMs);

    const options: WatchOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    try {
      watchId = watcher.watch((coords) => {
        const fix = positionFromCoords(coords);
        samples.push(fix);
        if (fix.usable) finish(fix);
      }, options);
    } catch (error) {
      finish(null, error);
    }
  });
}

/**
 * The device's best available position, from its GPS / Wi-Fi provider.
 *
 * A single lookup can return an IP-derived fix with a 50 km radius. We keep a
 * watch open for a short window with high accuracy enabled and use the most
 * accurate sample, or stop early once a fix is good enough for a pickup.
 */
export function getBestDevicePosition(sampleMs = WATCH_SAMPLE_MS): Promise<DevicePosition> {
  const watcher = nativeWatcher() ?? browserWatcher();
  if (!watcher) {
    return Promise.reject(new Error("This device cannot share a location. Type the address instead."));
  }

  return collectBestFix(watcher, sampleMs);
}
