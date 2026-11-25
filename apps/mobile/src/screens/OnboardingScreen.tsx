import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FlashLogo } from "~/components/ui/FlashLogo";
import { Icon } from "~/components/ui/Icon";
import { cn } from "~/lib/cn";

const SLIDES = [
  {
    headline: ["Your city,", "your ticket."],
    accent: "Never miss a night.",
    body: "Concerts, comedy and festivals — find what is on and book in seconds.",
    image: "/assets/images/onboarding-event-tickets.webp",
    alt: "A smiling person in an orange jacket holding a phone with event tickets among music notes and stage lights",
  },
  {
    headline: ["Good food,", "right to your door."],
    accent: "Dinner, handled.",
    body: "Order from the kitchens you love and follow every bite on the way.",
    image: "/assets/images/onboarding-food-delivery.webp",
    alt: "An orange delivery scooter with a rider and food boxes in front of a phone showing a food app",
  },
  {
    headline: ["Around town,", "in a flash."],
    accent: "Get going.",
    body: "A keke, a taxi or a ride for the whole crew — one tap and you are moving.",
    image: "/assets/images/onboarding-keke-ride.webp",
    alt: "An orange keke tricycle with its driver on a dark background",
  },
];

/**
 * First-run onboarding: one full-bleed illustration per service, a single
 * promise per slide, and one way in. Progress is visible but never blocks the
 * product — Skip and Sign In enter from any slide.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const enter = () => navigate("/", { replace: true });

  return (
    <div className="relative h-full w-full overflow-hidden bg-media">
      {SLIDES.map((item, i) => (
        <img
          key={item.image}
          src={item.image}
          alt={i === index ? item.alt : ""}
          aria-hidden={i !== index}
          draggable={false}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div className="relative flex h-full flex-col px-5">
        <div className="safe-top shrink-0" />
        <div className="flex items-start justify-between gap-3 pt-5">
          <FlashLogo tone="light" size="lg" />
          <button
            type="button"
            onClick={enter}
            className="-mr-2 grid h-11 min-w-11 place-items-center rounded-full px-3 text-[12.5px] font-semibold text-white/85 transition active:bg-white/10"
          >
            Skip
          </button>
        </div>

        <div className="mt-auto">
          <div key={index} className="animate-fade">
            <h1 className="max-w-[19rem] text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-white">
              {slide.headline[0]}
              <br />
              {slide.headline[1]}
            </h1>
            <p className="mt-2.5 text-[18px] font-semibold leading-tight tracking-[-0.02em] text-brand">
              {slide.accent}
            </p>
            <p className="mt-3.5 max-w-[19rem] text-[13.5px] leading-[1.55] text-white/80">
              {slide.body}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2" role="tablist" aria-label="Onboarding slides">
              {SLIDES.map((item, dot) => {
                const active = dot === index;
                return (
                  <button
                    key={item.image}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`Slide ${dot + 1}: ${item.accent}`}
                    onClick={() => setIndex(dot)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      active ? "w-5 bg-brand" : "w-1.5 bg-white/40",
                    )}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-semibold tabular-nums tracking-[0.08em] text-white/60">
              {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            onClick={enter}
            className={cn(
              "mt-5 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-brand-solid",
              "text-[15px] font-semibold text-brand-fg shadow-brand transition active:scale-[0.99] active:bg-brand-ink",
            )}
          >
            Get started
            <Icon name="arrow-right" size={18} />
          </button>

          <p className="mt-5 pb-[max(env(safe-area-inset-bottom),26px)] text-center text-[11.5px] text-white/70">
            Already have an account?{" "}
            <button
              type="button"
              onClick={enter}
              className="font-semibold text-white underline-offset-4 active:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
