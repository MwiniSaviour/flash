"use client";

import { useRef, useState } from "react";

import { Icon } from "@/components/flash/Icon";
import { uploadImageAction } from "@/lib/media/actions";
import { deliveryUrl } from "@/lib/media/url";
import { cn } from "@/lib/utils";

/**
 * A photo picker.
 *
 * Shown only when Cloudinary is connected. The file goes to one server action,
 * which validates and compresses it before storing; this component only ever
 * sees the returned public URL.
 */
export function PhotoUpload({
  kind,
  label,
  value,
  onChange,
}: {
  kind: "cover" | "dish" | "poster";
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadImageAction(formData, kind);

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onChange(result.data.url);
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
        className="hidden"
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deliveryUrl(value, 160)}
            alt=""
            className="h-14 w-14 shrink-0 rounded-[11px] object-cover"
          />
        ) : null}

        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-[11px] border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand/45 hover:text-brand-ink disabled:opacity-60",
          )}
        >
          <Icon name="plus" size={14} />
          {busy ? "Uploading…" : value ? "Change photo" : label}
        </button>
      </div>

      <p className="mt-1.5 text-[11.5px] leading-snug text-muted-soft">
        JPEG, PNG, WebP, AVIF or HEIC, up to 8 MB. Stored as compressed WebP.
      </p>

      {error ? (
        <p role="alert" className="mt-1 text-[12px] text-danger-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
