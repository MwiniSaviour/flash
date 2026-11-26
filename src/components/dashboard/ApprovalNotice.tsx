import { Icon } from "@/components/flash/Icon";
import type { Business } from "@/lib/flash/types";

/**
 * The approval notice.
 *
 * The platform approves a business before it may publish. The console still
 * opens - a manager should be able to see their kitchen while the application
 * is being read - but the notice says plainly why nothing can be posted yet.
 */
export function ApprovalNotice({ business }: { business: Business }) {
  if (business.status === "approved") return null;

  const declined = business.status === "declined";

  return (
    <div
      className={`rounded-[16px] border p-4 ${
        declined ? "border-danger/25 bg-danger-soft" : "border-warning/25 bg-warning-soft"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 ${declined ? "text-danger" : "text-warning"}`}>
          <Icon name={declined ? "info" : "clock"} size={17} />
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-ink">
            {declined ? "This business was not approved" : "Your application is under review"}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {declined
              ? "The ScalDive team did not approve this application. You can still read the console, but nothing can be posted or sold."
              : "You can look around the console, but nothing can be posted or sold until the ScalDive team approves the application."}
          </p>
        </div>
      </div>
    </div>
  );
}
