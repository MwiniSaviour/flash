import type { Metadata } from "next";

import { TrackingScreen } from "@/components/track/TrackingScreen";
import {
  getCurrentUser,
  listDeliveries,
  listPastDeliveries,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Track",
  description: "Follow your orders, parcels and rides until they arrive.",
};

export default async function TrackPage() {
  const [user, deliveries, past] = await Promise.all([
    getCurrentUser(),
    listDeliveries(),
    listPastDeliveries(),
  ]);

  return <TrackingScreen deliveries={deliveries} past={past} user={user} />;
}
