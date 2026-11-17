import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TicketCheckout } from "@/components/events/TicketCheckout";
import { getEventBySlug } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tier?: string; qty?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const quantity = Math.max(1, Math.min(6, Number(query.qty ?? 1) || 1));

  return <TicketCheckout event={event} tierId={query.tier ?? ""} quantity={quantity} />;
}
