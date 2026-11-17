import type { Metadata } from "next";

import { RideScreen } from "@/components/ride/RideScreen";
import {
  getCurrentUser,
  getSavedPlaces,
  listDeliveries,
} from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Ride",
  description: "Book a keke, taxi, trotro or private ride across Accra with Flash.",
};

export default async function RidePage() {
  const [savedPlaces, user, deliveries] = await Promise.all([
    getSavedPlaces(),
    getCurrentUser(),
    listDeliveries(),
  ]);

  const activeRide = deliveries.find((delivery) => delivery.kind === "ride");

  return <RideScreen activeRide={activeRide} user={user} savedPlaces={savedPlaces} />;
}
