"use client";

import { useEffect, useState } from "react";

import type { Delivery } from "@/lib/flash/data/tracking";
import type { Booking, BookingKind, ImageAsset, Ticket } from "@/lib/flash/types";

/**
 * Purchases confirmed in this browser.
 *
 * The server is the source of truth when a database is connected. Until then,
 * a completed Paystack charge still has to land in the wallet immediately, so
 * the receipt is journalled here and merged into the server-rendered lists on
 * the client. No payment state is invented: these rows are written only after
 * verification or an explicit cash confirmation.
 */

const STORAGE_KEY = "flash:purchases:v1";
const CHANGE_EVENT = "flash:purchases-changed";

export type LocalPurchase = {
  id: string;
  booking: Booking;
  ticket?: Ticket;
  delivery?: Delivery;
  createdAt: string;
};

export type PurchaseInput = {
  kind: BookingKind;
  id: string;
  reference: string;
  number?: string;
  title: string;
  subtitle: string;
  price: number;
  paid: boolean;
  image: ImageAsset;
  details: string[];
  from?: string;
  fromPlace?: string;
  to?: string;
  toPlace?: string;
  ticket?: {
    eventId: string;
    tierId: string;
    tierName: string;
    quantity: number;
  };
};

function riderImage(): ImageAsset {
  return {
    src: "/assets/images/customer-support.svg",
    alt: "Customer support agent with a headset",
  };
}

function deliveryFor(input: PurchaseInput): Delivery {
  const waiting = input.paid ? "confirmed" : "pending delivery";
  const label = input.kind === "order" ? "order" : input.kind === "ride" ? "ride" : "parcel";

  return {
    id: input.id,
    kind: input.kind === "ticket" ? "parcel" : input.kind,
    number: input.number ?? input.reference,
    title: input.title,
    status: waiting,
    statusLabel: input.paid ? `${label} confirmed` : `Pending ${label}`,
    from: input.from ?? input.title,
    fromPlace: input.fromPlace ?? "",
    to: input.to ?? input.subtitle,
    toPlace: input.toPlace ?? "",
    progress: 0,
    // No distance, timer or route is shown until a rider is assigned.
    eta: "Rider to be assigned",
    reference: input.reference,
    rider: {
      name: "Rider to be assigned",
      photo: riderImage(),
      vehicle: "—",
      plate: "—",
    },
    image: input.image,
    steps: [
      { label: "Confirmed", done: true, current: true },
      { label: "Rider assigned", done: false, current: false },
      { label: "On the way", done: false, current: false },
      { label: "Delivered", done: false, current: false },
    ],
  };
}

/** Journalled after a verified payment or an explicit cash confirmation. */
export function recordPurchase(input: PurchaseInput): void {
  if (typeof window === "undefined") return;

  const now = new Date().toISOString();
  const booking: Booking = {
    id: input.id,
    kind: input.kind,
    title: input.title,
    subtitle: input.subtitle,
    status: input.paid ? "confirmed" : "pending",
    when: now,
    price: input.price,
    reference: input.reference,
    image: input.image,
    details: input.details,
    href:
      input.kind === "ticket"
        ? "/tickets"
        : input.kind === "order"
          ? `/orders/${input.id}`
          : input.kind === "ride"
            ? `/rides/${input.id}`
            : `/parcels/${input.id}`,
  };

  const record: LocalPurchase = {
    id: input.id,
    booking,
    ticket: input.ticket
      ? {
          id: input.id,
          eventId: input.ticket.eventId,
          tierId: input.ticket.tierId,
          tierName: input.ticket.tierName,
          quantity: input.ticket.quantity,
          status: input.paid ? "confirmed" : "pending",
          reference: input.reference,
          purchasedAt: now,
        }
      : undefined,
    delivery: input.kind === "ticket" ? undefined : deliveryFor(input),
    createdAt: now,
  };

  const existing = readPurchases().filter((item) => item.id !== record.id);
  const next = [record, ...existing];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // A full or disabled localStorage must never block a confirmed purchase.
  }
}

function readPurchases(): LocalPurchase[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LocalPurchase[]) : [];
  } catch {
    return [];
  }
}

/** Reads the browser journal in an effect, never during render. */
export function useLocalPurchases(): LocalPurchase[] {
  const [purchases, setPurchases] = useState<LocalPurchase[]>([]);

  useEffect(() => {
    const sync = () => setPurchases(readPurchases());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return purchases;
}
