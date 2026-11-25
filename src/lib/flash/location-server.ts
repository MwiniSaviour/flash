import { cookies } from "next/headers";

import { parseCity } from "./location";

/** The city the server uses to scope storefront lists. */
export async function currentCity(): Promise<string | null> {
  const store = await cookies();
  return parseCity(store.get("flash_city")?.value);
}
