import type { Metadata } from "next";

import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { SavedPlacesManager } from "@/components/dashboard/SavedPlacesManager";
import { getSavedPlaces } from "@/lib/flash/repository";

export const metadata: Metadata = { title: "Saved places" };

export default async function SavedPlacesPage() {
  const places = await getSavedPlaces();

  return (
    <>
      <ProfilePageHeader
        title="Saved places"
        subtitle="The shortcuts you use when booking a ride."
      />
      <SavedPlacesManager initial={places} />
    </>
  );
}
