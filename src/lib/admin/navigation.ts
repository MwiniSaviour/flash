import type { IconName } from "@/components/flash/Icon";

export type AdminSection = {
  path: string;
  label: string;
  icon: IconName;
};

export const ADMIN_GROUPS: { label: string; sections: AdminSection[] }[] = [
  {
    label: "Platform",
    sections: [
      { path: "", label: "Overview", icon: "dashboard" },
      { path: "approvals", label: "Approvals", icon: "check-circle" },
      { path: "payments", label: "Payments", icon: "banknote" },
      { path: "bookings", label: "Bookings", icon: "receipt" },
      { path: "requests", label: "Ticket requests", icon: "ticket" },
      { path: "analytics", label: "Analytics", icon: "dashboard" },
    ],
  },
  {
    label: "Configuration",
    sections: [{ path: "settings", label: "Settings", icon: "settings" }],
  },
];

export function adminHref(path: string): string {
  return path ? `/admin/${path}` : "/admin";
}
