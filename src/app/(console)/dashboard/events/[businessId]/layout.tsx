import { notFound } from "next/navigation";

import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { ConsoleTopbar } from "@/components/dashboard/ConsoleTopbar";
import { getOwnedBusiness, listBusinesses } from "@/lib/flash/repository";

/** The events console's chrome, shared by every section page. */
export default async function EventsConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, businesses] = await Promise.all([
    getOwnedBusiness(businessId, "events"),
    listBusinesses(),
  ]);

  if (!business) notFound();

  return (
    <ConsoleShell
      kind="events"
      businessId={business.id}
      businesses={businesses}
      currentId={business.id}
    >
      <ConsoleTopbar
        name={business.name}
        kind="events"
        businessId={business.id}
        businesses={businesses}
        currentId={business.id}
      />
      {children}
    </ConsoleShell>
  );
}
