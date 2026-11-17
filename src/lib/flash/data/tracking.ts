/**
 * Demo tracking fixtures.
 *
 * Everything in motion at once: two food orders and one ride, each with a
 * route, a courier, a reference and a stage. Invented for the UI/UX pass.
 */

import type { Fulfilment, ImageAsset } from "@/lib/flash/types";

export type DeliveryKind = "order" | "ride" | "parcel";
export type DeliveryStage = "preparing" | "on the way" | "arriving" | "delivered";

export interface DeliveryStep {
  label: string;
  done: boolean;
  current: boolean;
}

export interface Delivery {
  id: string;
  kind: DeliveryKind;
  /** The number the customer reads out — the order, ride or tracking number. */
  number: string;
  title: string;
  /** What is being carried — a parcel's contents. */
  parcelType?: string;
  /** Who receives a parcel, and how the courier reaches them. */
  recipientName?: string;
  recipientPhone?: string;
  /** What is inside, in the sender's own words. */
  parcelDetails?: string;
  status: DeliveryStage;
  statusLabel: string;
  /** Where it is coming from. */
  from: string;
  fromPlace: string;
  /** Where it is going. */
  to: string;
  toPlace: string;
  /** 0 → 1 along the route. */
  progress: number;
  eta: string;
  reference: string;
  /** What it costs, in whole cedis. */
  price?: number;
  /** The route it covers, for rides and parcels. */
  distanceKm?: number;
  durationMinutes?: number;
  rider: { name: string; photo: ImageAsset; vehicle: string; plate: string };
  image: ImageAsset;
  steps: DeliveryStep[];
  /** The full receipt — present on food orders. */
  receipt?: {
    lines: { name: string; quantity: number; price: number }[];
    subtotal: number;
    /** What the kitchen took off. */
    discount?: number;
    deliveryFee: number;
    total: number;
    address: string;
    /** How the order reaches the customer. */
    fulfilment?: Fulfilment;
  };
}

export const deliveries: Delivery[] = [
  {
    id: "ord-7712",
    kind: "order",
    number: "70028008",
    title: "Auntie Muni's Kitchen",
    status: "on the way",
    statusLabel: "On the way",
    from: "Auntie Muni's Kitchen",
    fromPlace: "Osu, Accra",
    to: "Nii Boa Street",
    toPlace: "Ridge, Accra",
    progress: 0.62,
    eta: "14 min",
    reference: "FLS-7712-0098",
    price: 129,
    rider: {
      name: "Ama Boateng",
      photo: {
        src: "/assets/images/avatar-fatima-ba-nyagse.jpg",
        alt: "Portrait of Ama Boateng, the rider bringing your order",
      },
      vehicle: "Delivery bike",
      plate: "GR-1094-B",
    },
    image: {
      src: "/assets/images/dish-fried-rice.jpg",
      alt: "Fried rice with chicken, sweetcorn and spring onion on a square plate",
    },
    steps: [
      { label: "Order placed", done: true, current: false },
      { label: "Kitchen accepted", done: true, current: false },
      { label: "Picked up", done: true, current: true },
      { label: "Delivered", done: false, current: false },
    ],
    receipt: {
      lines: [
        { name: "Party jollof & grilled chicken", quantity: 2, price: 45 },
        { name: "Hibiscus sobolo", quantity: 2, price: 12 },
      ],
      subtotal: 114,
      deliveryFee: 15,
      total: 129,
      address: "Nii Boa Street, Ridge",
    },
  },
  {
    id: "ord-7713",
    kind: "order",
    number: "60025008",
    title: "Buka 24",
    status: "preparing",
    statusLabel: "Preparing",
    from: "Buka 24",
    fromPlace: "Airport Residential",
    to: "Nii Boa Street",
    toPlace: "Ridge, Accra",
    progress: 0.18,
    eta: "34 min",
    reference: "FLS-7713-4420",
    rider: {
      name: "Yaw Osei",
      photo: {
        src: "/assets/images/avatar-solomon-geyidonyah.jpg",
        alt: "Portrait of Yaw Osei, the rider bringing your order",
      },
      vehicle: "Delivery bike",
      plate: "GN-7732-K",
    },
    image: {
      src: "/assets/images/dish-bbq.jpg",
      alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
    },
    steps: [
      { label: "Order placed", done: true, current: false },
      { label: "Kitchen accepted", done: true, current: true },
      { label: "Picked up", done: false, current: false },
      { label: "Delivered", done: false, current: false },
    ],
  },
  {
    id: "par-7002",
    kind: "parcel",
    number: "FLS-P-7002-4901",
    parcelType: "Documents",
    recipientName: "Efua Mensah",
    recipientPhone: "024 412 8890",
    parcelDetails: "Passport and contracts — hand to Efua only",
    title: "Documents to Ring Road",
    status: "on the way",
    statusLabel: "With the courier",
    from: "Oxford Street",
    fromPlace: "Osu, Accra",
    to: "Ring Road",
    toPlace: "Ridge, Accra",
    progress: 0.44,
    eta: "11 min",
    reference: "FLS-P-7002-4901",
    price: 18,
    distanceKm: 4.6,
    rider: {
      name: "Nii Lartey",
      photo: {
        src: "/assets/images/avatar-nana-yaa.jpg",
        alt: "Portrait of Nii Lartey, the courier carrying your parcel",
      },
      vehicle: "Parcel bike",
      plate: "GN-4417-M",
    },
    image: {
      src: "/assets/images/ride-bike-sunset.jpg",
      alt: "A motorcyclist riding at sunset on an open road",
    },
    steps: [
      { label: "Parcel booked", done: true, current: false },
      { label: "Courier assigned", done: true, current: false },
      { label: "Picked up", done: true, current: true },
      { label: "Delivered", done: false, current: false },
    ],
  },
  {
    id: "ride-5501",
    kind: "ride",
    number: "55012204",
    title: "Taxi to Labadi Beach",
    status: "arriving",
    statusLabel: "Arriving",
    from: "Oxford Street",
    fromPlace: "Osu, Accra",
    to: "Labadi Beach",
    toPlace: "Labadi, Accra",
    progress: 0.84,
    eta: "4 min",
    reference: "FLS-5501-2208",
    price: 28,
    distanceKm: 3.8,
    durationMinutes: 14,
    rider: {
      name: "Kojo Mensah",
      photo: {
        src: "/assets/images/avatar-david-kuunyoo.jpg",
        alt: "Portrait of Kojo Mensah, the rider assigned to your booking",
      },
      vehicle: "Toyota Corolla",
      plate: "GR-4821-X",
    },
    image: {
      src: "/assets/images/ride-driver-pov.jpg",
      alt: "A driver's hands on the steering wheel at dusk",
    },
    steps: [
      { label: "Ride requested", done: true, current: false },
      { label: "Rider assigned", done: true, current: false },
      { label: "On the way", done: true, current: true },
      { label: "Arrived", done: false, current: false },
    ],
  },
];

export interface PastDelivery {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  price: number;
  image: ImageAsset;
  href: string;
}

export const pastDeliveries: PastDelivery[] = [
  {
    id: "past-1",
    title: "Buka 24",
    subtitle: "Suya platter · delivered in 31 min",
    when: "Fri 13 Nov",
    price: 80,
    image: {
      src: "/assets/images/dish-bbq.jpg",
      alt: "Grilled meat skewers laid on paper with peppers and dipping sauces",
    },
    href: "/bookings",
  },
  {
    id: "past-2",
    title: "Taxi to East Legon",
    subtitle: "Osu → East Legon · Kojo Mensah",
    when: "Thu 12 Nov",
    price: 28,
    image: {
      src: "/assets/images/ride-bike-sunset.jpg",
      alt: "A motorcyclist riding at sunset on an open road",
    },
    href: "/bookings",
  },
];
