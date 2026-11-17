/**
 * Demo ride fixtures.
 *
 * Invented classes, fares and drivers for the UI/UX pass. The classes borrow
 * the transport Accra actually moves on — the keke (pragya), the goods-carrying
 * tricycle for short hops, the trotro between neighbourhoods, a hired taxi and
 * the private premium ride — priced in whole cedis like every other surface in
 * Flash.
 */

import type { Driver, RideClass, RideQuote } from "@/lib/flash/types";

export const rideClasses: RideClass[] = [
  {
    id: "flash-bike",
    name: "Keke",
    description: "Also called pragya — the tricycle that carries goods",
    seats: 1,
    etaMinutes: 6,
    price: 8,
    perk: "Short hops, no traffic",
  },
  {
    id: "flash-go",
    name: "Taxi",
    description: "The everyday hired car, up to four",
    seats: 4,
    etaMinutes: 12,
    price: 28,
    perk: "Official hire, door to door",
  },
  {
    id: "flash-xl",
    name: "TroTro",
    description: "The minibus that runs between neighbourhoods",
    seats: 6,
    etaMinutes: 16,
    price: 35,
    perk: "Room for the crew",
  },
  {
    id: "flash-comfort",
    name: "Premium",
    description: "Newer private car with air conditioning",
    seats: 4,
    etaMinutes: 14,
    price: 45,
    perk: "Air conditioning",
  },
];

/**
 * The biggest party Flash can carry in one ride — the classes top out at six
 * seats, so the party size on the Ride screen stops there.
 */
export const MAX_PASSENGERS = 6;

/** The quote the Ride screen opens with. */
export const rideQuote: RideQuote = {
  pickup: "Oxford Street, Osu",
  dropoff: "Labadi Beach, Accra",
  distanceKm: 3.8,
  durationMinutes: 14,
  classes: rideClasses,
};

/** Saved places, offered under the pickup and drop-off fields. */
export const savedPlaces = [
  { id: "sp-home", label: "Home", detail: "Nii Boa Street, Ridge" },
  { id: "sp-work", label: "Work", detail: "Airport Residential" },
  { id: "sp-labadi", label: "Labadi Beach", detail: "Labadi" },
  { id: "sp-mad", label: "MAD", detail: "Accra Mall" },
];

export const drivers: Driver[] = [
  {
    id: "drv-kojo",
    name: "Kojo Mensah",
    rating: 4.92,
    photo: {
      src: "/assets/images/avatar-david-kuunyoo.jpg",
      alt: "Portrait of Kojo Mensah, the rider assigned to your booking",
    },
    plate: "GR-4821-X",
    vehicle: "Toyota Corolla • Silver",
    completedRides: 3184,
  },
  {
    id: "drv-ama",
    name: "Ama Boateng",
    rating: 4.88,
    photo: {
      src: "/assets/images/avatar-fatima-ba-nyagse.jpg",
      alt: "Portrait of Ama Boateng, the rider assigned to your booking",
    },
    plate: "GR-1094-B",
    vehicle: "Nissan Note • Blue",
    completedRides: 2210,
  },
  {
    id: "drv-yaw",
    name: "Yaw Osei",
    rating: 4.79,
    photo: {
      src: "/assets/images/avatar-solomon-geyidonyah.jpg",
      alt: "Portrait of Yaw Osei, the rider assigned to your booking",
    },
    plate: "GN-7732-K",
    vehicle: "Honda PCX • Black",
    completedRides: 1408,
  },
];
