// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Delivery } from "@/lib/flash/data/tracking";

import { DeliveryCard } from "./TrackingChrome";

function delivery(overrides: Partial<Delivery> = {}): Delivery {
  return {
    id: "ride-1",
    kind: "ride",
    number: "5501",
    title: "Taxi to Labadi Beach",
    status: "confirmed",
    statusLabel: "Confirmed",
    from: "Oxford Street",
    fromPlace: "Osu, Accra",
    to: "Labadi Beach",
    toPlace: "Labadi, Accra",
    progress: 0,
    eta: "",
    reference: "FLS-5501-2208",
    price: 28,
    distanceKm: 3.8,
    durationMinutes: 14,
    riderAssigned: false,
    rider: {
      name: "Costumer Support",
      photo: {
        src: "/assets/images/customer-support.svg",
        alt: "Customer support agent with a headset",
      },
      vehicle: "",
      plate: "",
    },
    image: {
      src: "/assets/images/ride-driver-pov.jpg",
      alt: "A driver's hands on the steering wheel at dusk",
    },
    steps: [],
    ...overrides,
  };
}

afterEach(cleanup);

describe("DeliveryCard live progress", () => {
  it.each(["confirmed", "pending delivery"] as const)(
    "shows no rider and no live progress for %s",
    (status) => {
      const { container } = render(
        <DeliveryCard
          delivery={delivery({
            status,
            statusLabel: status === "confirmed" ? "Confirmed" : "Pending delivery",
            progress: 0.62,
            eta: "14 min",
          })}
        />,
      );

      expect(screen.getByText("No rider assigned yet")).toBeTruthy();
      expect(screen.queryByRole("progressbar")).toBeNull();
      expect(screen.queryByText("14 min")).toBeNull();
      expect(screen.queryByText("Osu, Accra")).toBeNull();
      expect(container.textContent).not.toContain("3.8");
    },
  );

  it("shows the route progress and ETA when a rider is assigned on the way", () => {
    render(
      <DeliveryCard
        delivery={delivery({
          status: "on the way",
          statusLabel: "On the way",
          progress: 0.62,
          eta: "14 min",
          riderAssigned: true,
        })}
      />,
    );

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("62");
    expect(screen.getByText("14 min")).toBeTruthy();
    expect(screen.queryByText("No rider assigned yet")).toBeNull();
  });

  it("withholds progress from an on the way delivery with no assigned rider", () => {
    render(
      <DeliveryCard
        delivery={delivery({
          status: "on the way",
          statusLabel: "On the way",
          progress: 0.62,
          eta: "14 min",
          riderAssigned: false,
        })}
      />,
    );

    expect(screen.getByText("No rider assigned yet")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("14 min")).toBeNull();
  });
});
