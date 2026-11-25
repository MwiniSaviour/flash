"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { useToast } from "@/components/flash/ToastProvider";
import { applyForBusiness } from "@/lib/flash/business-actions";
import type { BusinessKind } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

const KINDS: { value: BusinessKind; label: string; detail: string }[] = [
  {
    value: "restaurant",
    label: "A kitchen",
    detail: "Cook, set your menu and your prices, and take orders.",
  },
  {
    value: "events",
    label: "Events",
    detail: "Post events, set what a ticket costs, and see who is coming.",
  },
  {
    value: "driver",
    label: "Driving",
    detail: "Carry orders and parcels. The driver console is not part of this build yet.",
  },
];

/**
 * The application.
 *
 * One form, three kinds of business. It asks for what the team needs to
 * approve: the name, who to reach, where the business is and what it is.
 */
export function BusinessApplicationForm() {
  const [kind, setKind] = useState<BusinessKind>("restaurant");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [about, setAbout] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const notify = useToast();

  function submit() {
    startTransition(async () => {
      const result = await applyForBusiness({
        kind,
        name,
        email,
        phone,
        neighbourhood,
        about,
      });

      if (!result.ok) {
        notify(result.error);
        return;
      }

      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-[20px] border border-line/90 bg-surface p-5 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success-ink">
          <Icon name="check" size={28} />
        </span>
        <h2 className="mt-4 text-[20px] font-bold tracking-[-0.02em] text-ink">
          Application sent
        </h2>
        <p className="mx-auto mt-1.5 max-w-[36ch] text-[13.5px] leading-relaxed text-muted">
          The Flash team reads every application. You will hear at {email || "your email"} once it is
          approved — and the console opens the moment it is.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover"
          >
            Go to your dashboard
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link
            href="/profile"
            className="flex h-[46px] items-center justify-center rounded-[12px] border border-line bg-surface text-[14px] font-semibold text-ink"
          >
            Back to your profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <fieldset>
        <legend className="text-[15px] font-bold tracking-[-0.01em] text-ink">
          What do you want to run?
        </legend>

        <div className="mt-2.5 space-y-2">
          {KINDS.map((option) => {
            const active = option.value === kind;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[14px] border p-3.5 text-left transition",
                  active
                    ? "border-brand/45 bg-brand-soft/40"
                    : "border-line/90 bg-surface hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                    active ? "border-brand-solid bg-brand-solid" : "border-line-strong bg-surface",
                  )}
                >
                  {active ? <Icon name="check" size={12} className="text-white" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-ink">{option.label}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                    {option.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-muted">
            The name of the business
          </span>
          <input
            data-field="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Auntie Muni's Kitchen"
            className="h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-muted">Email</span>
            <input
              type="email"
              data-field="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.gh"
              className="h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-muted">Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+233 24 000 0000"
              className="h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[12px] font-semibold text-muted">Where you are</span>
          <input
            value={neighbourhood}
            onChange={(event) => setNeighbourhood(event.target.value)}
            placeholder="Osu, Accra"
            className="h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-[12px] font-semibold text-muted">
            What do you do, and what does the customer get?
          </span>
          <textarea
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            rows={3}
            placeholder="Ghanaian home cooking out of Osu, packed to travel and delivered within 30 minutes."
            className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[15px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover active:bg-brand-solid-pressed disabled:opacity-80"
      >
        {isPending ? "Sending…" : "Send the application"}
        <Icon name="arrow-right" size={16} />
      </button>

      <p className="mt-3 text-center text-[12px] leading-relaxed text-muted-soft">
        You can browse Flash as a guest while you wait.
      </p>
    </div>
  );
}
