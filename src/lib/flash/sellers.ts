import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** A seller is a Clerk user, never a row invented by the application. */
export type Seller = {
  clerkUserId: string;
  displayName: string;
  email: string;
  createdAt?: string;
};

type SellerRow = {
  clerk_user_id: string;
  display_name: string;
  email: string;
  created_at?: string | null;
};

function toSeller(row: SellerRow): Seller {
  return {
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at ?? undefined,
  };
}

/** Insert or refresh the seller row for a Clerk user with the seller role. */
export async function upsertSeller(input: {
  clerkUserId: string;
  displayName: string;
  email: string;
}): Promise<void> {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const { error } = await client.from("sellers").upsert(
    {
      clerk_user_id: input.clerkUserId,
      display_name: input.displayName,
      email: input.email,
    },
    { onConflict: "clerk_user_id" },
  );

  if (error) throw new Error(`Could not save the seller row: ${error.message}`);
}

/** List real seller rows. There is no fixture fallback. */
export async function listSellers(): Promise<Seller[]> {
  const client = createAdminClient();
  if (!client) throw new Error("Database is not configured");

  const { data, error } = await client
    .from("sellers")
    .select("clerk_user_id, display_name, email, created_at")
    .order("display_name", { ascending: true });

  if (error) throw new Error(`Could not read sellers: ${error.message}`);
  return (data ?? []).map((row) => toSeller(row as SellerRow));
}
