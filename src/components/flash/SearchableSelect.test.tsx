// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchableSelect } from "./SearchableSelect";

const mocks = vi.hoisted(() => ({
  getBestDevicePosition: vi.fn(),
  nearbyPlaces: vi.fn(),
  reverseGeocode: vi.fn(),
  searchPlaces: vi.fn(),
}));

vi.mock("@/components/flash/device-location", () => ({
  MAX_USABLE_ACCURACY_M: 100,
  getBestDevicePosition: mocks.getBestDevicePosition,
  getDevicePosition: mocks.getBestDevicePosition,
}));

vi.mock("@/lib/flash/places", () => ({
  nearbyPlaces: mocks.nearbyPlaces,
  reverseGeocode: mocks.reverseGeocode,
  searchPlaces: mocks.searchPlaces,
}));

const coarse = {
  point: { lat: 9.9673103, lng: -2.4603285 },
  accuracy: 50000,
  usable: false,
  coarse: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.searchPlaces.mockResolvedValue([]);
});

afterEach(cleanup);

describe("SearchableSelect precise location", () => {
  it("offers nearby areas for a coarse fix without committing a pickup point", async () => {
    mocks.getBestDevicePosition.mockResolvedValue(coarse);
    mocks.nearbyPlaces.mockResolvedValue([
      {
        id: "n1",
        label: "Piisi",
        detail: "Wa Municipal District",
        lat: 9.9673103,
        lng: -2.4603285,
      },
      {
        id: "n2",
        label: "Kumfabiala",
        detail: "Wa Municipal District",
        lat: 9.99,
        lng: -2.48,
      },
    ]);

    const onChange = vi.fn();
    render(<SearchableSelect label="Pickup" value="" onChange={onChange} placeholder="Search" precise />);

    fireEvent.click(screen.getByRole("button", { name: /use precise location/i }));

    expect(await screen.findByText(/near you/i)).toBeTruthy();
    expect(screen.getByRole("option", { name: /Piisi/ })).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Kumfabiala/ }));
    expect(onChange).toHaveBeenCalledWith("Kumfabiala", { lat: 9.99, lng: -2.48 });
  });

  it("commits a precise fix directly", async () => {
    mocks.getBestDevicePosition.mockResolvedValue({
      point: { lat: 9.9673103, lng: -2.4603285 },
      accuracy: 25,
      usable: true,
      coarse: false,
    });
    mocks.reverseGeocode.mockResolvedValue({
      label: "Piisi",
      detail: "Wa Municipal District, Upper West Region",
    });

    const onChange = vi.fn();
    render(<SearchableSelect label="Pickup" value="" onChange={onChange} placeholder="Search" precise />);

    fireEvent.click(screen.getByRole("button", { name: /use precise location/i }));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        "Piisi, Wa Municipal District, Upper West Region",
        { lat: 9.9673103, lng: -2.4603285 },
      ),
    );
  });

  it("prefills the area label when no nearby candidates are found", async () => {
    mocks.getBestDevicePosition.mockResolvedValue(coarse);
    mocks.nearbyPlaces.mockResolvedValue([]);
    mocks.reverseGeocode.mockResolvedValue({ label: "Piisi", detail: "Upper West Region" });

    const onChange = vi.fn();
    render(<SearchableSelect label="Pickup" value="" onChange={onChange} placeholder="Search" precise />);

    fireEvent.click(screen.getByRole("button", { name: /use precise location/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("Piisi, Upper West Region"));
    expect(screen.queryByText(/near you/i)).toBeNull();
  });
});
