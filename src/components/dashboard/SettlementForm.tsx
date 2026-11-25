"use client";

import { useEffect, useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import {
  getSettlementBanks,
  saveSettlementDetails,
} from "@/lib/flash/business-actions";

type Provider = { code: string; name: string };

/** Where Paystack sends this business's money after a fulfilled sale. */
export function SettlementForm({ businessId }: { businessId: string }) {
  const [momo, setMomo] = useState<Provider[]>([]);
  const [banks, setBanks] = useState<Provider[]>([]);
  const [type, setType] = useState<"mobile_money" | "nuban">("mobile_money");
  const [code, setCode] = useState("");
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  useEffect(() => {
    getSettlementBanks()
      .then((result) => {
        setMomo(result.momo);
        setBanks(result.banks);
      })
      .catch(() => notify("We could not load the payment providers."));
  }, [notify]);

  const providers = type === "mobile_money" ? momo : banks;

  function save() {
    setSaved(false);
    startTransition(async () => {
      const result = await saveSettlementDetails({
        businessId,
        bankCode: code,
        accountNumber: account,
        type,
        accountName: name,
      });
      if (!result.ok) {
        notify(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <section className="rounded-[16px] border border-line/90 bg-surface p-4">
      <h2 className="text-[15px] font-bold text-ink">How you get paid</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Customers pay Flash securely. We send your share to this account after the sale is
        fulfilled. Register a Mobile Money number or a bank account.
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {(["mobile_money", "nuban"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setType(option);
                setCode("");
              }}
              className={`h-10 flex-1 rounded-[10px] border px-3 text-[12.5px] font-semibold ${
                type === option
                  ? "border-brand bg-brand-soft text-brand-ink"
                  : "border-line text-muted"
              }`}
            >
              {option === "mobile_money" ? "Mobile Money" : "Bank account"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Provider</span>
          <select
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink"
          >
            <option value="">Choose a provider</option>
            {providers.map((provider) => (
              <option key={provider.code} value={provider.code}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Account number</span>
          <input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            inputMode="numeric"
            placeholder="0551234987"
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">
            Name on the account
          </span>
          <input
            data-field="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your business name"
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isPending || !code || account.length < 9}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white disabled:opacity-60"
      >
        <Icon name={saved ? "check" : "banknote"} size={16} />
        {saved ? "Payment details saved" : isPending ? "Verifying…" : "Save payment details"}
      </button>
    </section>
  );
}
