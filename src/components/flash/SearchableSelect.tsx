"use client";

import { useEffect, useId, useRef, useState } from "react";

import { getDevicePosition } from "@/components/flash/device-location";
import { Icon } from "@/components/flash/Icon";
import type { GeoPoint } from "@/lib/flash/geo";
import { reverseGeocode, searchPlaces, type Place } from "@/lib/flash/places";
import { cn } from "@/lib/utils";

/**
 * A typeahead address field backed by a streamed geocoder.
 *
 * Suggestions come from Photon's CDN and are cached on the device, so a poor
 * connection can reuse recent searches. "Use precise location" asks the device
 * for its position (native fused provider in the Capacitor app) and resolves an
 * address through the same CDN, falling back to coordinates offline.
 */
export function SearchableSelect({
  label,
  value,
  onChange,
  placeholder,
  precise = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string, point?: GeoPoint) => void;
  placeholder: string;
  precise?: boolean;
  className?: string;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const needle = value.trim();
    if (!open || needle.length < 2) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    const timer = window.setTimeout(() => {
      void searchPlaces(needle, controller.signal).then((results) => {
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setActive(0);
        setBusy(false);
        if (results.length && results[0].cached) {
          setNotice("Showing a saved search — this device is offline.");
        }
      });
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, open]);

  function choose(place: Place) {
    setNotice(place.cached ? "Saved result · reconnect for a refreshed address." : place.detail);
    setOpen(false);
    onChange(place.label, { lat: place.lat, lng: place.lng });
  }

  async function locateOnDevice() {
    setLocating(true);
    setNotice(null);
    try {
      const position = await getDevicePosition();
      const address = await reverseGeocode(position.point);
      setNotice(
        `${address.label || address.detail} · accurate to about ${Math.round(position.accuracy)} m`,
      );
      setOpen(false);
      onChange("Current location", position.point);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Location is unavailable.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("min-w-0 flex-1", className)}>
      <span className="block text-[12px] font-semibold leading-tight text-muted">{label}</span>

      <div className="relative mt-1">
        <input
          value={value}
          onChange={(event) => {
            setBusy(true);
            setNotice(null);
            setOpen(true);
            onChange(event.target.value);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && suggestions[active]) {
              event.preventDefault();
              choose(suggestions[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          className="w-full bg-transparent text-[16px] leading-snug text-ink placeholder:text-muted focus:outline-none"
        />

        {open && value.trim().length >= 2 && suggestions.length ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-60 overflow-y-auto rounded-[12px] border border-line bg-surface py-1 shadow-raised"
          >
            {suggestions.map((place, index) => (
              <li key={place.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(place)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2 text-left",
                    index === active ? "bg-surface-2" : "hover:bg-surface-2/60",
                  )}
                >
                  <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-icon-idle" />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">{place.label}</span>
                    <span className="block truncate text-[11.5px] text-muted">{place.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {busy ? <p className="mt-1 text-[11px] text-muted">Looking up places…</p> : null}
      {notice ? <p className="mt-1 text-[11px] leading-snug text-muted">{notice}</p> : null}

      {precise ? (
        <button
          type="button"
          onClick={() => void locateOnDevice()}
          disabled={locating}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-brand-ink transition hover:border-brand/40 disabled:opacity-60"
        >
          <Icon name="navigation" size={13} />
          {locating ? "Finding your location…" : "Use precise location"}
        </button>
      ) : null}
    </div>
  );
}
