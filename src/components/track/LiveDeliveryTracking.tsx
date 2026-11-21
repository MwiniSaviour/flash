"use client";

import { DeliveryTracking } from "@/components/track/DeliveryTracking";
import type { Delivery } from "@/lib/flash/data/tracking";
import { useLiveTracking } from "@/lib/flash/use-live-tracking";

export function LiveDeliveryTracking({ delivery }: { delivery: Delivery }) {
  useLiveTracking(delivery.id, delivery.kind);
  return <DeliveryTracking delivery={delivery} />;
}
