import type { Metadata } from "next";

import { ApplicationTable } from "@/components/admin/ApplicationTable";
import { listApplications } from "@/lib/flash/admin-repository";

export const metadata: Metadata = { title: "Approvals" };

export default async function AdminApprovalsPage() {
  const applications = await listApplications();

  return (
    <>
      <h1 className="text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
        Approvals
      </h1>
      <p className="mt-1.5 text-[13px] text-muted">
        Decide which businesses may publish on the platform.
      </p>
      <div className="mt-6">
        <ApplicationTable rows={applications} />
      </div>
    </>
  );
}
