"use client";

import { useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { PhotoUpload } from "@/components/flash/PhotoUpload";
import { Sheet } from "@/components/flash/Sheet";
import { deliveryUrl } from "@/lib/media/url";
import { cn } from "@/lib/utils";

export type DrawerField =
  | { type: "text"; name: string; label: string; placeholder?: string }
  | { type: "number"; name: string; label: string; min?: number; max?: number }
  | { type: "textarea"; name: string; label: string }
  | { type: "tags"; name: string; label: string }
  | { type: "date"; name: string; label: string }
  | {
      type: "image";
      name: string;
      label: string;
      sources: { src: string; alt: string }[];
      uploadKind: "dish" | "poster";
    };

export type DrawerValues = Record<string, string | number>;

const INPUT =
  "h-11 w-full rounded-[11px] border border-line bg-paper px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none";

/**
 * The edit/create drawer.
 *
 * One form shape for every product a console manages: text, amounts, tags,
 * scheduled dates and an image that can be picked from the catalogue or
 * uploaded. The owning table supplies the fields and the save action; the
 * drawer owns only the form state and the busy/error states.
 */
export function RecordDrawer({
  title,
  fields,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  fields: DrawerField[];
  initial: DrawerValues;
  onSave: (values: DrawerValues) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<DrawerValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (name: string, value: string | number) =>
    setValues((current) => ({ ...current, [name]: value }));

  async function save() {
    setBusy(true);
    setError(null);
    const result = await onSave(values);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "That change could not be saved.");
      return;
    }
    onClose();
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white transition hover:bg-brand-solid-hover disabled:opacity-60"
          >
            <Icon name="check" size={15} />
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-[12px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {fields.map((field) => {
          if (field.type === "image") {
            const src = String(values[field.name] ?? "");

            return (
              <div key={field.name}>
                <span className="mb-1.5 block text-[12px] font-semibold text-muted">
                  {field.label}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {field.sources.map((source) => (
                    <button
                      key={source.src}
                      type="button"
                      onClick={() => set(field.name, source.src)}
                      aria-label={source.alt}
                      aria-pressed={src === source.src}
                      className={cn(
                        "relative h-16 overflow-hidden rounded-[10px] ring-2 transition",
                        src === source.src ? "ring-brand" : "ring-transparent hover:ring-line-strong",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={deliveryUrl(source.src, 128)}
                        alt={source.alt}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-3 border-t border-line/80 pt-3">
                  <PhotoUpload
                    kind={field.uploadKind}
                    label="Or upload your own photo"
                    value={src}
                    onChange={(url) => set(field.name, url)}
                  />
                </div>
              </div>
            );
          }

          return (
            <label key={field.name} className="block">
              <span className="mb-1 block text-[12px] font-semibold text-muted">
                {field.label}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  value={String(values[field.name] ?? "")}
                  onChange={(event) => set(field.name, event.target.value)}
                  rows={3}
                  className={cn(INPUT, "h-auto py-2.5")}
                />
              ) : field.type === "tags" ? (
                <input
                  type="text"
                  value={String(values[field.name] ?? "")}
                  onChange={(event) => set(field.name, event.target.value)}
                  placeholder="Bestseller, Smoky"
                  className={INPUT}
                />
              ) : (
                <input
                  type={field.type}
                  value={String(values[field.name] ?? "")}
                  onChange={(event) =>
                    set(
                      field.name,
                      field.type === "number" ? Number(event.target.value) : event.target.value,
                    )
                  }
                  min={field.type === "number" ? field.min : undefined}
                  max={field.type === "number" ? field.max : undefined}
                  className={INPUT}
                />
              )}
            </label>
          );
        })}

        {error ? (
          <p role="alert" className="text-[12.5px] text-danger-ink">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
