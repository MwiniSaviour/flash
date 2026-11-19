"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { updateProfile } from "@/lib/flash/profile-actions";
import type { FlashUser } from "@/lib/flash/types";

export function AccountSettingsForm({ initial }: { initial: FlashUser }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const result = await updateProfile({ name, email });
      if (!result.ok) {
        setError(result.error ?? "The profile could not be saved.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      router.refresh();
    });
  }

  return (
    <section className="mt-5 px-5">
      <h2 className="text-[14px] font-bold text-ink">Your details</h2>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink focus:border-brand/50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-[11px] border border-line bg-surface px-3 text-[13.5px] text-ink focus:border-brand/50 focus:outline-none"
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-2.5 text-[12.5px] text-danger-ink">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-[12px] bg-brand-solid px-5 text-[14px] font-bold text-white disabled:opacity-60"
      >
        <Icon name="check" size={15} />
        {saved ? "Saved" : pending ? "Saving…" : "Save details"}
      </button>
    </section>
  );
}
