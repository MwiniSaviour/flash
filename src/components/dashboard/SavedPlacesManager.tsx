"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import {
  addSavedPlace,
  deleteSavedPlace,
  updateSavedPlace,
} from "@/lib/flash/profile-actions";
import type { SavedPlace } from "@/lib/flash/types";

export function SavedPlacesManager({ initial }: { initial: SavedPlace[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");

  function reset() {
    setLabel("");
    setDetail("");
    setAdding(false);
    setEditing(null);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "That change could not be saved.");
        return;
      }
      reset();
      router.refresh();
    });
  }

  return (
    <div className="mt-5 px-5">
      {error ? (
        <p role="alert" className="mb-3 text-[12.5px] text-danger-ink">
          {error}
        </p>
      ) : null}

      {initial.length ? (
        <ul className="space-y-2">
          {initial.map((place) => (
            <li
              key={place.id}
              className="rounded-[14px] border border-line/90 bg-surface p-3.5"
            >
              {editing === place.id ? (
                <div className="space-y-2.5">
                  <input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    aria-label="Place name"
                    placeholder="Home"
                    className="h-10 w-full rounded-[10px] border border-line bg-paper px-3 text-[13px] focus:border-brand/50 focus:outline-none"
                  />
                  <input
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    aria-label="Place address"
                    placeholder="12 Fifth Street, Ridge"
                    className="h-10 w-full rounded-[10px] border border-line bg-paper px-3 text-[13px] focus:border-brand/50 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateSavedPlace({ id: place.id, label, detail }))
                      }
                      className="h-9 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="h-9 rounded-[10px] border border-line px-3 text-[12.5px] font-semibold text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-icon-idle">
                    <Icon name="map-pin" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-ink">
                      {place.label}
                    </span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {place.detail}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(place.id);
                      setLabel(place.label);
                      setDetail(place.detail);
                    }}
                    className="text-[12.5px] font-semibold text-brand-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteSavedPlace(place.id))}
                    className="text-[12.5px] font-semibold text-danger-ink"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[14px] border border-dashed border-line-strong/70 bg-surface/60 p-6 text-center text-[13px] text-muted">
          No saved places yet. Add the places you go to most.
        </p>
      )}

      {adding ? (
        <div className="mt-3 space-y-2.5 rounded-[14px] border border-line/90 bg-surface p-3.5">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            aria-label="Place name"
            placeholder="Home"
            className="h-10 w-full rounded-[10px] border border-line bg-paper px-3 text-[13px] focus:border-brand/50 focus:outline-none"
          />
          <input
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            aria-label="Place address"
            placeholder="12 Fifth Street, Ridge"
            className="h-10 w-full rounded-[10px] border border-line bg-paper px-3 text-[13px] focus:border-brand/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => addSavedPlace({ label, detail }))}
              className="h-9 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-bold text-white disabled:opacity-60"
            >
              Add place
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-9 rounded-[10px] border border-line px-3 text-[12.5px] font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-[11px] border border-dashed border-line-strong bg-surface/60 px-3.5 text-[13px] font-semibold text-ink"
        >
          <Icon name="plus" size={15} />
          Add a place
        </button>
      )}

      <Link
        href="/ride"
        className="mt-5 inline-flex items-center gap-1 text-[13px] font-bold text-brand-ink"
      >
        Use a saved place for a ride
        <Icon name="chevron-right" size={13} />
      </Link>
    </div>
  );
}
