"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PulseMeter, PulseStrip } from "@/components/flash/FlashLogo";
import { Icon, type IconName } from "@/components/flash/Icon";
import type { ImageAsset } from "@/lib/flash/types";

export interface HeroSlide {
  id: string;
  kind: "event" | "food";
  badge: string;
  title: string;
  meta: string;
  price: string;
  image: ImageAsset;
  href: string;
}

/**
 * The home hero: five slides of what is trending, events and food.
 *
 * The reference app opens on one live broadcast; ScalDive opens on the same
 * shape — a full-bleed media panel with a scrim, the headline and a round
 * action — but the slide show moves through what is actually trending tonight.
 * The pulse meter (the brand's own bars) is the position indicator.
 */
export function HeroCarousel({
  slides,
  interval = 6500,
}: {
  slides: HeroSlide[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (next: number) => {
      const element = scroller.current;
      if (!element) return;
      const width = element.clientWidth || 1;
      const clamped = (next + slides.length) % slides.length;
      element.scrollTo({ left: clamped * width, behavior: "smooth" });
    },
    [slides.length],
  );

  // The active slide is whatever is centred, not whatever was clicked.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = element.clientWidth || 1;
        setIndex(Math.round(element.scrollLeft / width));
      });
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Autoplay, suspended while the reader is touching the rail and whenever
  // reduced motion is asked for.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let held = false;
    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
    };

    element.addEventListener("pointerdown", hold);
    element.addEventListener("touchstart", hold);
    element.addEventListener("pointerup", release);
    element.addEventListener("touchend", release);

    const timer = setInterval(() => {
      if (held || document.hidden) return;
      const width = element.clientWidth || 1;
      goTo(Math.round(element.scrollLeft / width) + 1);
    }, interval);

    return () => {
      clearInterval(timer);
      element.removeEventListener("pointerdown", hold);
      element.removeEventListener("touchstart", hold);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("touchend", release);
    };
  }, [goTo, interval]);

  return (
    <div className="relative isolate mx-5 overflow-hidden rounded-[20px] bg-media shadow-card">
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        role="region"
        aria-roledescription="carousel"
        aria-label="Trending in Accra"
        tabIndex={-1}
      >
        {slides.map((slide) => (
          <article
            key={slide.id}
            className="relative h-[224px] w-full shrink-0 snap-center"
            aria-roledescription="slide"
            aria-label={`${slide.title} — ${slide.badge}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image.src}
              alt={slide.image.alt}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/30" />

            <span className="relative flex h-full flex-col justify-between p-3.5">
              <span className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-solid px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true" />
                  {slide.badge}
                </span>

                <span className="rounded-full bg-black/45 px-2 py-1.5 backdrop-blur-sm">
                  <PulseMeter count={slides.length} active={index} onSelect={goTo} />
                </span>
              </span>

              <span className="flex items-end justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[19px] font-bold leading-tight tracking-[-0.02em] text-white">
                    {slide.title}
                  </span>
                  <span className="mt-1 block truncate text-[12.5px] text-white/85">{slide.meta}</span>
                  <span className="mt-2 flex items-center gap-2.5">
                    <PulseStrip height={15} />
                    <span className="text-[12px] font-medium leading-none text-brand">
                      {slide.price}
                    </span>
                  </span>
                </span>

                <Link
                  href={slide.href}
                  aria-label={`${slide.badge}: ${slide.title}`}
                  className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-brand-solid text-white shadow-brand-lift ring-[3px] ring-white/15 transition active:scale-95"
                >
                  <Icon name={slide.kind === "event" ? "ticket" : "bowl"} size={20} />
                </Link>
              </span>
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

export const heroIcons: Record<HeroSlide["kind"], IconName> = {
  event: "ticket",
  food: "food",
};
