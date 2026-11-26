import { notFound } from "next/navigation";

import { SellerProducts } from "@/components/dashboard/SellerProducts";
import { currentRole, currentUserId } from "@/lib/auth/server";
import { listMyEvents, listMyKitchens } from "@/lib/flash/repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My products",
  description: "Create and manage the events and kitchens you sell on ScalDive.",
};

export default async function ProductsPage() {
  const [userId, role] = await Promise.all([currentUserId(), currentRole()]);
  if (!userId || (role !== "business_owner" && role !== "admin")) notFound();

  const [events, restaurants] = await Promise.all([listMyEvents(), listMyKitchens()]);
  return <SellerProducts events={events} restaurants={restaurants} />;
}
