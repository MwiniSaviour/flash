import { notFound } from "next/navigation";

import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { ConsoleTopbar } from "@/components/dashboard/ConsoleTopbar";
import { getOwnedBusiness, listBusinesses } from "@/lib/flash/repository";

/**
 * The kitchen console's chrome.
 *
 * A layout at the business segment can read the id, so the shell and top bar
 * are shared by every section page. A foreign, unknown or wrong-kind id stops
 * here before any section renders.
 */
export default async function RestaurantConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, businesses] = await Promise.all([
    getOwnedBusiness(businessId, "restaurant"),
    listBusinesses(),
  ]);

  if (!business) notFound();

  return (
    <ConsoleShell
      kind="restaurant"
      businessId={business.id}
      businesses={businesses}
      currentId={business.id}
    >
      <ConsoleTopbar
        name={business.name}
        kind="restaurant"
        businessId={business.id}
        businesses={businesses}
        currentId={business.id}
      />
      {children}
    </ConsoleShell>
  );
}
