// Admin UI was merged into the ScalMart dashboard. Any /admin/* URL redirects
// there with the Flash project selected; the unified dashboard owns the gate.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
