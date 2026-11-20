"use client";

import { useState, useTransition } from "react";

import { SignInGate } from "@/components/auth/SignInGate";
import { Icon } from "@/components/flash/Icon";
import { requestTickets } from "@/lib/flash/actions";

/** Ask the planner and the platform for a place when a tier has sold out. */
export function SoldOutRequest({
  eventId,
  tierId,
  tierName,
}: {
  eventId: string;
  tierId: string;
  tierName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await requestTickets({
        eventId,
        tierId,
        name,
        phone,
        email,
        quantity: 1,
        note,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="flex items-center gap-2 text-[13px] font-semibold text-success-ink">
        <Icon name="check" size={15} />
        Request sent — we will tell you when a place opens.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] border border-line bg-surface text-[15px] font-bold text-ink transition hover:border-brand/45 lg:max-w-[320px]"
      >
        Ask for a place
        <Icon name="bell" size={16} />
      </button>
    );
  }

  return (
    <div className="ml-auto w-full max-w-[320px] rounded-[14px] border border-line/90 bg-surface p-3">
      <p className="text-[13px] font-bold text-ink">Request a place · {tierName}</p>
      <div className="mt-2 space-y-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          className="h-10 w-full rounded-[10px] border border-line px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone"
            aria-label="Phone"
            className="h-10 w-full rounded-[10px] border border-line px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            aria-label="Email"
            className="h-10 w-full rounded-[10px] border border-line px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </div>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Anything we should know?"
          aria-label="Note"
          className="h-10 w-full rounded-[10px] border border-line px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
        />
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-danger-ink">
          {error}
        </p>
      ) : null}
      <SignInGate
        label="Sign in to ask"
        className="mt-2.5 flex h-10 w-full items-center justify-center rounded-[10px] bg-brand-solid text-[13px] font-bold text-white"
      >
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !name.trim()}
          className="mt-2.5 h-10 w-full rounded-[10px] bg-brand-solid text-[13px] font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Sending." : "Send request"}
        </button>
      </SignInGate>
    </div>
  );
}
