import type { GeoPoint } from "@/lib/flash/geo";

/** A fix coarser than this is not usable for a pickup or a fare. */
export const MAX_USABLE_ACCURACY_M = 100;

/** How long watchPosition is allowed to refine the fix before we use the best sample. */
export const WATCH_SAMPLE_MS = 6000;

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
  watch: (
    onSample: (coords: DeviceCoords) => void,
    onError: (error: unknown) => void,
    options: WatchOptions,
  ) => number;
  clear: (id: number) => void;
  single?: (options: WatchOptions) => Promise<DeviceCoords>;
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
      watch: (onSample, onError, options) =>
        native.watchPosition!((position) => onSample(position.coords), onError, options),
      clear: (id) => native.clearWatch?.(id),
      single: native.getCurrentPosition
        ? (options) => native.getCurrentPosition!(options).then((position) => position.coords)
        : undefined,
    };
  }

  if (native.getCurrentPosition) {
    return {
      watch: (onSample, onError, options) => {
        const poll = () => {
          void native.getCurrentPosition!(options).then(
            (position) => onSample(position.coords),
            (error) => onError(error),
          );
        };
        poll();
        return window.setInterval(poll, 1000);
      },
      clear: (id) => {
        window.clearInterval(id);
      },
      single: (options) => native.getCurrentPosition!(options).then((position) => position.coords),
    };
  }

  return null;
}

function browserWatcher(): Watcher | null {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return {
    watch: (onSample, onError, options) =>
      navigator.geolocation.watchPosition(
        (position) => onSample(position.coords),
        (error) => onError(error),
        options,
      ),
    clear: (id) => navigator.geolocation.clearWatch(id),
    single: navigator.geolocation.getCurrentPosition
      ? (options) =>
          new Promise<DeviceCoords>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position.coords),
              (error) => reject(error),
              options,
            );
          })
      : undefined,
  };
}

function permissionMessage(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: number }).code;
    if (code === 1) return "Location permission was denied. Allow it in your browser, or type the address.";
    if (code === 2) return "Location is unavailable on this device. Type the address instead.";
    if (code === 3) return "Location request timed out. Try again, or type the address.";
  }
  return null;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Location is unavailable. Type the address instead.";
}

export function getBestDevicePosition(sampleMs = WATCH_SAMPLE_MS): Promise<DevicePosition> {
  const watcher = nativeWatcher() ?? browserWatcher();
  if (!watcher) {
    return Promise.reject(new Error("This device cannot share a location. Type the address instead."));
  }

  const options: WatchOptions = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0,
  };

  return new Promise<DevicePosition>((resolve, reject) => {
    const samples: DevicePosition[] = [];
    let settled = false;
    let watchId: number | null = null;
    let lastError: unknown = null;

    const finish = (position: DevicePosition | null, error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (watchId !== null) watcher.clear(watchId);
      watchId = null;
      if (position) resolve(position);
      else {
        const message = permissionMessage(error ?? lastError) ?? errorMessage(error ?? lastError);
        reject(new Error(message));
      }
    };

    const timer = setTimeout(() => finish(bestFix(samples), lastError), sampleMs);

    try {
      watchId = watcher.watch(
        (coords) => {
          const fix = positionFromCoords(coords);
          samples.push(fix);
          if (fix.usable) finish(fix);
        },
        (error) => {
          lastError = error;
          const message = permissionMessage(error);
          if (message && (error as { code?: number })?.code === 1) finish(null, error);
        },
        options,
      );
    } catch (error) {
      finish(null, error);
      return;
    }

    if (watcher.single) {
      void watcher.single(options).then(
        (coords) => {
          if (settled) return;
          samples.push(positionFromCoords(coords));
          const best = bestFix(samples);
          if (best?.usable) finish(best);
        },
        (error) => {
          lastError = error;
        },
      );
    }
  });
}