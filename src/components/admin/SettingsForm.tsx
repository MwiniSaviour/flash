"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import { updatePlatformSettings } from "@/lib/admin/actions";
import type { PlatformSettings } from "@/lib/payments/commission";

/** Commission rates, in ordinary percentages over basis points. */
export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const [goods, setGoods] = useState(String(initial.goodsCommissionBps / 100));
  const [selfDelivery, setSelfDelivery] = useState(
    String(initial.selfDeliveryGoodsCommissionBps / 100),
  );
  const [delivery, setDelivery] = useState(String(initial.deliveryCommissionBps / 100));
  const [hold, setHold] = useState(String(initial.payoutHoldHours));
  const [freeFee, setFreeFee] = useState(
    String((initial.freeEventAttendeeFeePesewas ?? 100) / 100),
  );
  const [ridePerKm, setRidePerKm] = useState(String(initial.ridePerKmPesewas / 100));
  const [parcelPerKm, setParcelPerKm] = useState(String(initial.parcelPerKmPesewas / 100));
  const [deliveryPerKm, setDeliveryPerKm] = useState(String(initial.deliveryPerKmPesewas / 100));
  const [deliveryBaseKm, setDeliveryBaseKm] = useState(String(initial.deliveryBaseKm));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  function save() {
    setSaved(false);

    startTransition(async () => {
      const result = await updatePlatformSettings({
        goodsCommissionBps: Number(goods) * 100,
        selfDeliveryGoodsCommissionBps: Number(selfDelivery) * 100,
        deliveryCommissionBps: Number(delivery) * 100,
        payoutHoldHours: Number(hold),
        freeEventAttendeeFeePesewas: Number(freeFee) * 100,
        ridePerKmPesewas: Number(ridePerKm) * 100,
        parcelPerKmPesewas: Number(parcelPerKm) * 100,
        deliveryPerKmPesewas: Number(deliveryPerKm) * 100,
        deliveryBaseKm: Number(deliveryBaseKm),
      });

      if (!result.ok) {
        notify(result.error);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    });
  }

  const fields = [
    { label: "On what is sold", value: goods, set: setGoods, detail: "Items and tickets", unit: "%" },
    {
      label: "Free event attendee",
      value: freeFee,
      set: setFreeFee,
      detail: "Flat fee per attendee, paid by the planner",
      unit: "GHS",
    },
    {
      label: "Seller delivers it",
      value: selfDelivery,
      set: setSelfDelivery,
      detail: "No delivery commission",
      unit: "%",
    },
    {
      label: "On the delivery fee",
      value: delivery,
      set: setDelivery,
      detail: "Flash delivers",
      unit: "%",
    },
    {
      label: "Ride distance",
      value: ridePerKm,
      set: setRidePerKm,
      detail: "Per km after the first 3 km",
      unit: "GHS/km",
    },
    {
      label: "Parcel distance",
      value: parcelPerKm,
      set: setParcelPerKm,
      detail: "Per km after the first 4.6 km",
      unit: "GHS/km",
    },
    {
      label: "Food delivery distance",
      value: deliveryPerKm,
      set: setDeliveryPerKm,
      detail: "Per km after the base distance",
      unit: "GHS/km",
    },
    {
      label: "Food base distance",
      value: deliveryBaseKm,
      set: setDeliveryBaseKm,
      detail: "Kilometres covered by the base fee",
      unit: "km",
    },
  ];

  return (
    <div className="rounded-[16px] border border-line/90 bg-surface p-4">
      <div className="space-y-3">
        {fields.map((field) => (
          <label key={field.label} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-ink">{field.label}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">{field.detail}</span>
            </span>
            <span className="flex h-10 w-24 shrink-0 items-center gap-1 rounded-[10px] border border-line px-2.5 focus-within:border-brand/50">
              <input
                value={field.value}
                onChange={(event) => field.set(event.target.value)}
                inputMode="decimal"
                aria-label={field.label}
                data-field={field.label === "On what is sold" ? "rate" : undefined}
                className="min-w-0 flex-1 bg-transparent text-right text-[14px] font-bold text-ink focus:outline-none"
              />
              <span className="text-[12px] font-semibold text-muted">{field.unit}</span>
            </span>
          </label>
        ))}

        <label className="flex items-center justify-between gap-3 border-t border-line/70 pt-3">
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">Payout hold</span>
            <span className="mt-0.5 block text-[11.5px] text-muted">Hours before release</span>
          </span>
          <span className="flex h-10 w-24 shrink-0 items-center gap-1 rounded-[10px] border border-line px-2.5 focus-within:border-brand/50">
            <input
              value={hold}
              onChange={(event) => setHold(event.target.value)}
              inputMode="numeric"
              aria-label="Payout hold hours"
              data-field="holdHours"
              className="min-w-0 flex-1 bg-transparent text-right text-[14px] font-bold text-ink focus:outline-none"
            />
            <span className="text-[12px] font-semibold text-muted">h</span>
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
      >
        <Icon name={saved ? "check" : "settings"} size={15} />
        {saved ? "Rates saved" : isPending ? "Saving…" : "Save rates"}
      </button>
    </div>
  );
}
