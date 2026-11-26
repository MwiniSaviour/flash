import type { Metadata } from "next";

import { ParcelScreen } from "@/components/parcel/ParcelScreen";
import { getCurrentUser } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Send a parcel",
  description: "Send documents, electronics, clothes and groceries across Accra with ScalDive.",
};

export default async function ParcelPage() {
  const user = await getCurrentUser();

  return <ParcelScreen user={user} />;
}
