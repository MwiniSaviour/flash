/**
 * Demo business fixtures.
 *
 * The console side of the product: the businesses the demo account runs, the
 * orders waiting on its kitchen and the tickets waiting on its events. They
 * are placed by other people, because an order only means something when
 * somebody else made it.
 */

import type { Business, Order, Ticket } from "@/lib/flash/types";

export const DEMO_USER_ID = "usr-saviour-mwini";

/** The businesses the demo account runs. */
export const businesses: Business[] = [
  {
    id: "biz-auntie-muni",
    userId: DEMO_USER_ID,
    kind: "restaurant",
    name: "Auntie Muni's Kitchen",
    email: "orders@auntiemunis.example.gh",
    phone: "+233 24 555 0142",
    neighbourhood: "Osu",
    about: "Ghanaian home cooking out of Osu, packed to travel.",
    status: "approved",
    createdAt: "2026-09-02T09:00:00.000Z",
    decidedAt: "2026-09-04T10:12:00.000Z",
  },
  {
    id: "biz-urban-vibes",
    userId: DEMO_USER_ID,
    kind: "events",
    name: "Urban Vibes Festival",
    email: "crew@urbanvibes.example.gh",
    phone: "+233 20 888 0917",
    neighbourhood: "Cantonments",
    about: "Two stages, a food market and a design fair at the Trade Fair Centre.",
    status: "approved",
    createdAt: "2026-08-19T14:30:00.000Z",
    decidedAt: "2026-08-21T08:05:00.000Z",
  },
];

/** The orders waiting on the demo kitchen. */
export const incomingOrders: Order[] = [
  {
    id: "ord-8801",
    restaurantId: "rst-auntie-muni",
    number: "70028115",
    fulfilment: "delivery",
    status: "awaiting confirmation",
    lines: [
      { menuItemId: "mi-muni-jollof", name: "Party jollof & grilled chicken", quantity: 2, price: 45 },
    ],
    subtotal: 90,
    discount: 0,
    deliveryFee: 15,
    placedAt: "2026-11-15T18:05:00.000Z",
    etaMinutes: 30,
    address: "12 Fifth Street, Ridge",
    rider: {
      id: "",
      name: "Ama Boateng",
      rating: 4.88,
      photo: {
        src: "/assets/images/avatar-fatima-ba-nyagse.jpg",
        alt: "Portrait of Ama Boateng, the rider bringing this order",
      },
      plate: "GR-1094-B",
      vehicle: "Nissan Note • Blue",
      completedRides: 2210,
    },
    reference: "FLS-8801-4410",
  },
  {
    id: "ord-8802",
    restaurantId: "rst-auntie-muni",
    number: "70028164",
    fulfilment: "pickup",
    status: "preparing",
    lines: [
      { menuItemId: "mi-muni-waakye", name: "Waakye with shito & egg", quantity: 2, price: 30 },
    ],
    subtotal: 60,
    discount: 0,
    deliveryFee: 0,
    placedAt: "2026-11-15T18:22:00.000Z",
    etaMinutes: 30,
    address: "",
    rider: {
      id: "",
      name: "Yaw Osei",
      rating: 4.79,
      photo: {
        src: "/assets/images/avatar-solomon-geyidonyah.jpg",
        alt: "Portrait of Yaw Osei, the rider bringing this order",
      },
      plate: "GN-7732-K",
      vehicle: "Honda PCX • Black",
      completedRides: 1408,
    },
    reference: "FLS-8802-5512",
  },
];

/** The tickets waiting on the demo promoter's event. */
export const incomingTickets: Ticket[] = [
  {
    id: "tkt-uv-kofi",
    eventId: "evt-urban-vibes-festival",
    tierId: "tier-urban-ga",
    tierName: "General Admission",
    quantity: 2,
    status: "pending",
    reference: "FLS-8801-1120",
    purchasedAt: "2026-11-15T19:12:00.000Z",
  },
  {
    id: "tkt-uv-efua",
    eventId: "evt-urban-vibes-festival",
    tierId: "tier-urban-vip",
    tierName: "VIP Experience",
    quantity: 1,
    status: "pending",
    reference: "FLS-8802-1130",
    purchasedAt: "2026-11-15T20:03:00.000Z",
  },
  {
    id: "tkt-uv-ama",
    eventId: "evt-urban-vibes-festival",
    tierId: "tier-urban-ga",
    tierName: "General Admission",
    quantity: 4,
    status: "confirmed",
    reference: "FLS-8803-1140",
    purchasedAt: "2026-11-16T07:40:00.000Z",
  },
];
