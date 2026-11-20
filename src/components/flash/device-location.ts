import type { GeoPoint } from "@/lib/flash/geo";

export type DevicePosition = {
  point: GeoPoint;
  accuracy: number;
};

type NativeGeolocation = {
  getCurrentPosition: (options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }) => Promise<{ coords: { latitude: number; longitude: number; accuracy?: number } }>;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { Geolocation?: NativeGeolocation };
};

function nativeGeolocation(): NativeGeolocation | null {
  if (typeof window === "undefined") return null;
  const capacitor = (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins?.Geolocation ?? null;
}

/**
 * The device's best available position.
 *
 * In the Capacitor app this uses the native fused provider (GPS, WiFi and
 * cell) when @capacitor/geolocation is installed. On the web it falls back to
 * the browser Geolocation API. Raw WiFi/Bluetooth sensors are not readable
 * from a web page; the native provider already fuses them.
 */
export async function getDevicePosition(): Promise<DevicePosition> {
  const native = nativeGeolocation();

  if (native) {
    const position = await native.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
    const point = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    return { point, accuracy: position.coords.accuracy ?? 0 };
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("This device cannot share a location. Type the address instead.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });

  const point = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };

  return { point, accuracy: position.coords.accuracy };
}
