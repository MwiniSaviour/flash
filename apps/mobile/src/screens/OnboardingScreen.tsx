import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "~/components/ui/Icon";
import { PulseLogo } from "~/components/ui/PulseLogo";
import { cn } from "~/lib/cn";

const SLIDES = [
  {
    headline: ["More Than", "Just Music."],
    accent: "It’s Your Community.",
    body: "Stream live radio, discover local events, book tickets and be part of what’s happening around you.",
  },
  {
    headline: ["Live Radio,", "Every Hour."],
    accent: "Wa to the World.",
    body: "One station, all day. Wake up with Good Morning Wa, drive home with the Evening Bulletin.",
  },
  {
    headline: ["Your Tickets,", "One Wallet."],
    accent: "Never Miss a Night.",
    body: "Book Sunset Live Sessions, comedy nights and festivals, then walk in with your ticket already on your phone.",
  },
];

/**
 * Onboarding: full-bleed photography, the wordmark at the top, the three-slide
 * copy block, page dots and the primary "Get Started" action.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0b0d]">
      <img
        src="/assets/images/onboarding-hero.jpg"
        alt="A woman listening to Prototype Radio on headphones on a Wa street at night"
        className="absolute inset-0 h-full w-full object-cover object-[50%_32%]"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/92" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/92 via-black/45 to-transparent" />

      <div className="relative flex h-full flex-col px-5">
        {/* Full-bleed photo behind the device's own status bar; the safe-area
            padding keeps the wordmark clear of it on a notched phone. */}
        <div className="safe-top shrink-0" />
        <div className="flex pt-5">
          <PulseLogo tone="light" size="lg" className="scale-[1.3] origin-left" />
        </div>

        <div className="mt-auto pb-1">
          <div className="animate-fade" key={index}>
            <h1 className="text-[34px] font-bold leading-[1.04] tracking-[-0.03em] text-white">
              {slide.headline[0]}
              <br />
              {slide.headline[1]}
            </h1>
            <p className="mt-1.5 text-[25px] font-bold leading-tight tracking-[-0.025em] text-brand">
              {slide.accent}
            </p>
            <p className="mt-4 max-w-[19rem] text-[14px] leading-[1.55] text-white/82">
              {slide.body}
            </p>
          </div>

          <div className="mt-9 flex items-center gap-2" role="tablist" aria-label="Onboarding slides">
            {SLIDES.map((_, dot) => (
              <button
                key={dot}
                type="button"
                role="tab"
                aria-selected={dot === index}
                aria-label={`Slide ${dot + 1}`}
                onClick={() => setIndex(dot)}
                className={cn(
                  "h-[7px] w-[7px] rounded-full transition-colors",
                  dot === index ? "bg-brand" : "bg-white/35",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            // The mock's single action is "Get Started": it enters the app from
            // any slide. Paging is what the dots are for.
            onClick={() => navigate("/", { replace: true })}
            className={cn(
              "mt-5 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-brand",
              "text-[14.5px] font-semibold text-white shadow-[0_16px_34px_-14px_rgb(252_83_3/0.9)]",
              "transition active:scale-[0.99] active:bg-brand-pressed",
            )}
          >
            Get Started
            <Icon name="arrow-right" size={18} />
          </button>

          <p className="mt-[26px] pb-[max(env(safe-area-inset-bottom),30px)] text-center text-[11.5px] text-white/65">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="font-semibold text-white underline-offset-2 active:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
