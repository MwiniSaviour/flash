import { redirect } from "next/navigation";

import { consoleHref } from "@/lib/flash/console";
import { listBusinesses } from "@/lib/flash/repository";

/** Send a promoter to the events company they run: approved first, then any. */
export default async function EventsConsoleIndex() {
  const businesses = await listBusinesses();
  const companies = businesses.filter((business) => business.kind === "events");
  const chosen = companies.find((business) => business.status === "approved") ?? companies[0];

  redirect(chosen ? consoleHref("events", chosen.id) : "/dashboard");
}
