import { describe, expect, it } from "vitest";

import { orderToDelivery, parcelToDelivery, rideToDelivery } from "./delivery";
import type {
  DriverRow,
  OrderWithLinesRow,
  ParcelWithCourierRow,
  RestaurantRow,
  RideWithRiderRow,
} from "./rows";

const driver: DriverRow = {
  id: "drv-1",
  name: "Kojo Mensah",
  rating: 4.8,
  photo_src: "/assets/images/avatar-david-kuunyoo.jpg",
  photo_alt: "Portrait of Kojo Mensah, the rider on this delivery",
  plate: "GR-4821-X",
  vehicle: "Toyota Corolla",
  completed_rides: 12,
};

const dispatch = {
  dispatch_job_id: null,
  dispatch_app_id: null,
  dispatch_task_id: null,
  dispatch_task_status: null,
  dispatch_status_synced_at: null,
  dispatch_last_payload: {},
  dispatch_idempotency_key: null,
};

function ride(overrides: Partial<RideWithRiderRow> = {}): RideWithRiderRow {
  return {
    id: "ride-1",
    user_id: "user-1",
    rider_id: null,
    ride_class: "taxi",
    pickup: "Oxford Street",
    pickup_area: "Osu, Accra",
    dropoff: "Labadi Beach",
    dropoff_area: "Labadi, Accra",
    distance_km: 3.8,
    duration_minutes: 14,
    eta_minutes: 12,
    price: 28,
    passengers: 1,
    status: "requested",
    number: "5501",
    reference: "FLS-5501",
    scheduled_for: null,
    requested_at: "2026-11-24T10:00:00Z",
    ...dispatch,
    drivers: null,
    ride_classes: { id: "rc-1", name: "Taxi" },
    ...overrides,
  };
}

function parcel(overrides: Partial<ParcelWithCourierRow> = {}): ParcelWithCourierRow {
  return {
    id: "par-1",
    user_id: "user-1",
    courier_id: null,
    parcel_type: "Documents",
    parcel_size: "small",
    quantity: 1,
    recipient_name: "Efua Mensah",
    recipient_phone: "0244128890",
    details: "Contracts",
    pickup: "Oxford Street",
    pickup_area: "Osu, Accra",
    dropoff: "Ring Road",
    dropoff_area: "Ridge, Accra",
    distance_km: 4.6,
    price: 18,
    eta_minutes: 11,
    status: "booked",
    tracking_number: "FLS-P-1",
    scheduled_for: null,
    requested_at: "2026-11-24T10:00:00Z",
    ...dispatch,
    drivers: null,
    ...overrides,
  };
}

const restaurant: RestaurantRow = {
  id: "rst-1",
  slug: "buka-24",
  name: "Buka 24",
  tagline: "Local plates",
  cuisine: "Ghanaian",
  neighbourhood: "Airport Residential",
  rating: 4.6,
  rating_count: 42,
  delivery_fee: 15,
  eta_minutes: 32,
  distance_km: 2.4,
  badge: null,
  discount_percent: 0,
  owner_user_id: null,
  business_id: null,
  image_src: "/assets/images/dish-bbq.jpg",
  image_alt: "Grilled meat skewers on paper",
};

function order(overrides: Partial<OrderWithLinesRow> = {}): OrderWithLinesRow {
  return {
    id: "ord-1",
    user_id: "user-1",
    restaurant_id: restaurant.id,
    rider_id: null,
    number: "60025008",
    fulfilment: "delivery",
    status: "preparing",
    subtotal: 114,
    discount: 0,
    delivery_fee: 15,
    address: "Nii Boa Street, Ridge",
    eta_minutes: 32,
    reference: "FLS-7713-4420",
    placed_at: "2026-11-24T10:00:00Z",
    order_lines: [],
    restaurants: restaurant,
    drivers: null,
    ...overrides,
  };
}

describe("delivery mappers hide progress until a rider is assigned", () => {
  it.each(["scheduled", "due", "unassigned", "offered", "accepted"] as const)(
    "gives no progress, ETA or distance for a %s dispatch view",
    (state) => {
      const mapped = rideToDelivery(
        ride({
          dispatch_task_status: state,
          status: state,
          scheduled_for: state === "scheduled" ? "2027-01-01T10:00:00Z" : null,
        }),
      );

      expect(mapped.progress).toBe(0);
      expect(mapped.eta).toBe("");
      expect(mapped.distanceKm).toBeUndefined();
      expect(mapped.riderAssigned).toBe(false);
    },
  );

  it("gives no progress, ETA or distance when an en-route job has no driver row", () => {
    const mapped = parcelToDelivery(
      parcel({ dispatch_task_status: "en-route", status: "en-route" }),
    );

    expect(mapped.status).toBe("on the way");
    expect(mapped.progress).toBe(0);
    expect(mapped.eta).toBe("");
    expect(mapped.distanceKm).toBeUndefined();
    expect(mapped.riderAssigned).toBe(false);
  });

  it("shows progress, ETA and distance for an en-route job with a driver", () => {
    const mapped = rideToDelivery(
      ride({ dispatch_task_status: "en-route", status: "en-route", drivers: driver }),
    );

    expect(mapped.status).toBe("on the way");
    expect(mapped.progress).toBe(0.68);
    expect(mapped.eta).toBe("12 min");
    expect(mapped.distanceKm).toBe(3.8);
    expect(mapped.riderAssigned).toBe(true);
  });

  it("keeps a finished delivery's distance but drops its live ETA", () => {
    const mapped = parcelToDelivery(
      parcel({ dispatch_task_status: "delivered", status: "delivered", drivers: driver }),
    );

    expect(mapped.status).toBe("delivered");
    expect(mapped.progress).toBe(1);
    expect(mapped.eta).toBe("");
    expect(mapped.distanceKm).toBe(4.6);
  });

  it("gives an order no live progress until a rider is assigned and it is on the way", () => {
    expect(orderToDelivery(order())).toMatchObject({
      progress: 0,
      eta: "",
      riderAssigned: false,
    });

    const assigned = orderToDelivery(
      order({ status: "on the way", drivers: driver, rider_id: driver.id }),
    );
    expect(assigned).toMatchObject({ progress: 0.62, eta: "32 min", riderAssigned: true });
  });

  it("maps a database awaiting-confirmation order to a real stage with no progress", () => {
    const mapped = orderToDelivery(order({ status: "awaiting confirmation" }));

    expect(mapped.status).toBe("pending delivery");
    expect(mapped.statusLabel).toBe("Awaiting confirmation");
    expect(mapped.progress).toBe(0);
    expect(mapped.eta).toBe("");
  });
});
