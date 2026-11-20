import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bestFix,
  getBestDevicePosition,
  MAX_USABLE_ACCURACY_M,
  positionFromCoords,
  type DevicePosition,
} from "./device-location";

function fix(lat: number, lng: number, accuracy: number): DevicePosition {
  return {
    point: { lat, lng },
    accuracy,
    usable: accuracy <= MAX_USABLE_ACCURACY_M,
    coarse: accuracy > MAX_USABLE_ACCURACY_M,
  };
}

describe("positionFromCoords", () => {
  it("marks a GPS or Wi-Fi fix under 100 m as usable", () => {
    const result = positionFromCoords({
      latitude: 9.9673103,
      longitude: -2.4603285,
      accuracy: 25,
    });

    expect(result.point).toEqual({ lat: 9.9673103, lng: -2.4603285 });
    expect(result.accuracy).toBe(25);
    expect(result.usable).toBe(true);
    expect(result.coarse).toBe(false);
  });

  it("marks a 50 km fix as coarse and unusable", () => {
    const result = positionFromCoords({
      latitude: 9.9673103,
      longitude: -2.4603285,
      accuracy: 50000,
    });

    expect(result.usable).toBe(false);
    expect(result.coarse).toBe(true);
  });

  it("treats a missing accuracy as unusable", () => {
    const result = positionFromCoords({ latitude: 9.9673103, longitude: -2.4603285 });

    expect(result.accuracy).toBe(Number.POSITIVE_INFINITY);
    expect(result.usable).toBe(false);
    expect(result.coarse).toBe(true);
  });
});

describe("bestFix", () => {
  it("keeps the most accurate sample from a watchPosition stream", () => {
    const samples = [
      fix(10, -2, 50000),
      fix(10.01, -2.01, 1200),
      fix(9.9673103, -2.4603285, 25),
      fix(10.02, -2.02, 300),
    ];

    expect(bestFix(samples)).toEqual(fix(9.9673103, -2.4603285, 25));
  });

  it("returns null when no samples arrived", () => {
    expect(bestFix([])).toBeNull();
  });
});

describe("getBestDevicePosition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("samples with high accuracy via watchPosition and stops the watch", async () => {
    vi.useFakeTimers();
    const listeners: Array<(position: GeolocationPosition) => void> = [];
    const clearWatch = vi.fn();
    const watchPosition = vi.fn(
      (success: (position: GeolocationPosition) => void, ...rest: unknown[]) => {
        const options = rest[1] as PositionOptions;
        expect(options.enableHighAccuracy).toBe(true);
        expect(options.maximumAge).toBe(0);
        listeners.push(success);
        return 7;
      },
    );
    vi.stubGlobal("navigator", { geolocation: { watchPosition, clearWatch } });

    const pending = getBestDevicePosition(50);
    listeners[0]?.({
      coords: { latitude: 10, longitude: -2, accuracy: 50000 },
    } as GeolocationPosition);
    await vi.advanceTimersByTimeAsync(10);
    listeners[0]?.({
      coords: { latitude: 9.9673103, longitude: -2.4603285, accuracy: 25 },
    } as GeolocationPosition);
    await vi.advanceTimersByTimeAsync(50);

    const result = await pending;
    expect(result.usable).toBe(true);
    expect(result.accuracy).toBe(25);
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it("returns the coarse best fix when only coarse samples arrive", async () => {
    vi.useFakeTimers();
    const listeners: Array<(position: GeolocationPosition) => void> = [];
    const clearWatch = vi.fn();
    vi.stubGlobal("navigator", {
      geolocation: {
        watchPosition: (success: (position: GeolocationPosition) => void) => {
          listeners.push(success);
          return 9;
        },
        clearWatch,
      },
    });

    const pending = getBestDevicePosition(50);
    listeners[0]?.({
      coords: { latitude: 10, longitude: -2, accuracy: 50000 },
    } as GeolocationPosition);
    listeners[0]?.({
      coords: { latitude: 10.01, longitude: -2.01, accuracy: 40000 },
    } as GeolocationPosition);
    await vi.advanceTimersByTimeAsync(50);

    const result = await pending;
    expect(result.usable).toBe(false);
    expect(result.coarse).toBe(true);
    expect(result.accuracy).toBe(40000);
    expect(clearWatch).toHaveBeenCalledWith(9);
  });
});
