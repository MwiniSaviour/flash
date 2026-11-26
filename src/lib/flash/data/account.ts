/**
 * The signed-in demo customer and everything in their wallet.
 *
 * Invented person, invented bookings. The photograph is a stock portrait (see
 * docs/assets-provenance.md) and is not the person named here.
 */

import type { Booking, FlashUser, Order, Ticket } from "@/lib/flash/types";

export const user: FlashUser = {
  id: "usr-saviour-mwini",
  name: "Saviour Mwini",
  email: "saviour@flash.gh",
  avatarUrl: "/assets/images/avatar-saviour.jpg",
  memberSince: "March 2025",
  notificationsEnabled: true,
};

/** The ticket wallet: four live tickets plus one used. */
export const tickets: Ticket[] = [
  {
    id: "tkt-sunset-ga",
    eventId: "evt-sunset-live-sessions",
    tierId: "tier-sunset-ga",
    tierName: "General Admission",
    quantity: 2,
    status: "confirmed",
    reference: "FLS-4261-8820",
    purchasedAt: "2026-11-02T10:14:00.000Z",
  },
  {
    id: "tkt-urban-vip",
    eventId: "evt-urban-vibes-festival",
    tierId: "tier-urban-vip",
    tierName: "VIP Experience",
    quantity: 2,
    status: "confirmed",
    reference: "FLS-5101-6602",
    purchasedAt: "2026-11-08T18:02:00.000Z",
  },
  {
    id: "tkt-derby-ga",
    eventId: "evt-accra-derby",
    tierId: "tier-derby-ga",
    tierName: "General Admission",
    quantity: 4,
    status: "pending",
    reference: "FLS-5129-1147",
    purchasedAt: "2026-11-14T09:41:00.000Z",
  },
  {
    id: "tkt-ahiagodzi-vip",
    eventId: "evt-ahiagodzi-food-music",
    tierId: "tier-ahiagodzi-vip",
    tierName: "VIP Experience",
    quantity: 1,
    status: "confirmed",
    reference: "FLS-1205-3356",
    purchasedAt: "2026-11-11T20:30:00.000Z",
  },
  {
    id: "tkt-highlife-ga",
    eventId: "evt-highlife-legends-night",
    tierId: "tier-highlife-ga",
    tierName: "General Admission",
    quantity: 2,
    status: "used",
    reference: "FLS-1024-4417",
    purchasedAt: "2026-10-12T12:00:00.000Z",
  },
];

/** A live food order, so the order status surface has something to show. */
export const activeOrder: Order = {
  id: "ord-7712",
  restaurantId: "rst-auntie-muni",
  number: "70028008",
  fulfilment: "delivery",
  status: "on the way",
  lines: [
    { menuItemId: "mi-muni-jollof", name: "Party jollof & grilled chicken", quantity: 2, price: 45 },
    { menuItemId: "mi-muni-sobolo", name: "Hibiscus sobolo", quantity: 2, price: 12 },
  ],
  subtotal: 114,
  discount: 0,
  deliveryFee: 15,
  placedAt: "2026-11-15T17:42:00.000Z",
  etaMinutes: 14,
  address: "Nii Boa Street, Ridge",
  rider: {
    id: "drv-ama",
    name: "Ama Boateng",
    rating: 4.88,
    photo: {
      src: "/assets/images/avatar-fatima-ba-nyagse.jpg",
      alt: "Portrait of Ama Boateng, the rider bringing your order",
    },
    plate: "GR-1094-B",
    vehicle: "Delivery bike • Red",
    completedRides: 2210,
  },
  reference: "FLS-7712-0098",
};

/**
 * The bookings ledger — the fifth destination. One list holding every kind of
 * commitment the customer has made with ScalDive, newest first.
 */
export const bookings: Booking[] = [
  {
    id: "bkg-order-7712",
    kind: "order",
    title: "Auntie Muni's Kitchen",
    subtitle: "Party jollof & grilled chicken",
    status: "confirmed",
    when: "2026-11-15T18:12:00.000Z",
    price: 129,
    reference: "FLS-7712-0098",
    image: {
      src: "/assets/images/dish-fried-rice.jpg",
      alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
    },
    details: ["2 items • Sobolo × 2", "Nii Boa Street, Ridge", "Ama is riding to you"],
    href: "/bookings",
  },
  {
    id: "bkg-ride-5501",
    kind: "ride",
    title: "Taxi to Labadi Beach",
    subtitle: "Oxford Street, Osu → Labadi Beach",
    status: "completed",
    when: "2026-11-14T19:26:00.000Z",
    price: 28,
    reference: "FLS-5501-2208",
    image: {
      src: "/assets/images/ride-driver-pov.jpg",
      alt: "A driver's hands on the steering wheel at dusk",
    },
    details: ["Toyota Corolla • GR-4821-X", "3.8 km • 14 min", "Kojo Mensah · 4.92"],
    href: "/bookings",
  },
  {
    id: "bkg-ticket-sunset",
    kind: "ticket",
    title: "Sunset Live Sessions",
    subtitle: "General Admission × 2",
    status: "confirmed",
    when: "2026-11-20T18:00:00.000Z",
    price: 240,
    reference: "FLS-4261-8820",
    image: {
      src: "/assets/images/event-sunset-live.jpg",
      alt: "A crowd with hands raised in front of a lit stage at sunset",
    },
    details: ["Labadi Beach, Osu", "Doors 5:30 PM", "Show FLS-4261-8820"],
    href: "/bookings",
  },
  {
    id: "bkg-order-7698",
    kind: "order",
    title: "Buka 24",
    subtitle: "Suya platter",
    status: "completed",
    when: "2026-11-13T20:05:00.000Z",
    price: 80,
    reference: "FLS-7698-4413",
    image: {
      src: "/assets/images/dish-bbq.jpg",
      alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
    },
    details: ["1 item", "Airport Residential", "Delivered in 31 min"],
    href: "/bookings",
  },
  {
    id: "bkg-ride-5488",
    kind: "ride",
    title: "ScalDive Bike to East Legon",
    subtitle: "Osu → East Legon",
    status: "cancelled",
    when: "2026-11-12T08:15:00.000Z",
    price: 12,
    reference: "FLS-5488-1042",
    image: {
      src: "/assets/images/ride-bike-sunset.jpg",
      alt: "A motorcyclist riding at sunset on an open road",
    },
    details: ["Honda PCX • GN-7732-K", "Cancelled by you", "No charge"],
    href: "/bookings",
  },
  {
    id: "bkg-ticket-urban",
    kind: "ticket",
    title: "Urban Vibes Festival",
    subtitle: "VIP Experience × 2",
    status: "confirmed",
    when: "2026-11-27T12:00:00.000Z",
    price: 600,
    reference: "FLS-5101-6602",
    image: {
      src: "/assets/images/event-urban-vibes.jpg",
      alt: "Festival-goers in front of an illuminated main stage",
    },
    details: ["Accra Trade Fair Centre", "Gates 11:00 AM", "Show FLS-5101-6602"],
    href: "/bookings",
  },
];
