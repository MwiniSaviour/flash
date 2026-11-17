import QRCode from "qrcode";

import { cn } from "@/lib/utils";

/**
 * The booking code.
 *
 * A real, scannable QR of the booking reference — the thing a customer shows
 * at a gate, hands to a rider, or reads out over the phone. It is generated on
 * the server from the reference itself, so there is nothing to keep in sync and
 * nothing to fake.
 */
export async function BookingCode({
  value,
  caption,
  className,
}: {
  value: string;
  caption?: string;
  className?: string;
}) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#14120f", light: "#ffffff" },
  });

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="rounded-[16px] bg-white p-3 shadow-[0_1px_2px_rgb(23_26_31/0.07)] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 font-mono text-[15px] font-bold tracking-[0.08em] text-ink">{value}</p>
      {caption ? <p className="mt-1 text-center text-[12px] text-muted">{caption}</p> : null}
    </div>
  );
}
