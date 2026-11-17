import type { Metadata } from "next";

import { SearchScreen } from "@/components/search/SearchScreen";
import { listEvents, listRestaurants } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, events, restaurants] = await Promise.all([
    searchParams,
    listEvents(),
    listRestaurants(),
  ]);

  return <SearchScreen events={events} restaurants={restaurants} initialQuery={q ?? ""} />;
}
