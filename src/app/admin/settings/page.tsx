import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/SettingsForm";
import { getAdminSettings } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Settings
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Platform-wide commission rates and settlement timing.
      </p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </>
  );
}
