"use client";

import { useState, useTransition } from "react";

import { TableButton } from "@/components/dashboard/DataTable";
import { reassignRide } from "@/lib/admin/actions";

/** Row menu control that assigns a ride to a specific driver. */
export function ReassignRideControl({
  rideId,
  currentDriver,
  drivers,
}: {
  rideId: string;
  currentDriver?: string;
  drivers: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(currentDriver ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function assign() {
    if (!selected) return;
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await reassignRide(rideId, selected);
      if (!result.ok) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <div className="w-56 space-y-1.5 p-1" onClick={(event) => event.stopPropagation()}>
      <label className="block text-[11px] font-semibold text-muted">Assign driver</label>
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        aria-label="Choose a driver"
        className="h-9 w-full rounded-[9px] border border-line bg-paper px-2 text-[12px] text-ink focus:border-brand/50 focus:outline-none"
      >
        <option value="">Unassigned</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name}
          </option>
        ))}
      </select>
      <TableButton tone="primary" onClick={assign} disabled={!selected || selected === currentDriver || pending}>
        {pending ? "Saving…" : done ? "Assigned" : "Reassign"}
      </TableButton>
      {error ? <p className="text-[11px] text-danger-ink">{error}</p> : null}
    </div>
  );
}
