import { cn } from "~/lib/cn";

/**
 * Builder credit, shown at the foot of every profile screen. Scalmint is a real
 * link (opens in the system browser from the Capacitor shell) and the contact
 * line is a `tel:` link, so tapping it starts a call on device.
 */
export function ScalmintFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-7 px-5 pb-2 text-center", className)}>
      <p className="text-[11px] leading-snug text-muted-soft">
        Powered by{" "}
        <a
          href="https://scalmint.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink/70 underline decoration-ink/25 underline-offset-2 transition active:opacity-60"
        >
          Scalmint
        </a>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-soft">
        Contact{" "}
        <a
          href="tel:052703858"
          className="font-semibold tabular-nums text-ink/70 underline decoration-ink/25 underline-offset-2 transition active:opacity-60"
        >
          052703858
        </a>
      </p>
    </footer>
  );
}
