import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RestaurantDetail } from "@/components/food/RestaurantDetail";
import { getRestaurantBySlug } from "@/lib/flash/repository";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  return {
    title: restaurant?.name ?? "Kitchen",
    description: restaurant?.tagline ?? "Order food on Flash.",
  };
}

export default async function RestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) notFound();

  return <RestaurantDetail restaurant={restaurant} />;
}
