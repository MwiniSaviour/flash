import QRCode from "qrcode";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { cedis, distance, minutes } from "@/lib/flash/format";
import { deliveryQuote } from "@/lib/flash/pricing";
import type { Restaurant } from "@/lib/flash/types";

/**
 * The storefront poster.
 *
 * What a kitchen prints and puts up: the photograph, the name, the offer and
 * a code that opens the kitchen on a phone. The code is generated on the
 * server, so it is a real code to a real page — not a picture of one.
 */
export async function StorefrontPoster({
  restaurant,
  url,
}: {
  restaurant: Restaurant;
  url: string;
}) {
  const code = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#14120f", light: "#ffffff" },
  });

  return (
    <article className="poster mx-auto flex w-full max-w-[440px] flex-col overflow-hidden rounded-[20px] border border-line/90 bg-paper shadow-raised">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.image.src}
          alt={restaurant.image.alt}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {restaurant.discount ? (
          <span className="absolute left-5 top-5 rounded-full bg-brand-solid px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            {restaurant.discount.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <FlashLogo size="sm" />

        <h2 className="mt-4 text-[27px] font-bold leading-[1.05] tracking-[-0.03em] text-ink">
          {restaurant.name}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{restaurant.tagline}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line/80 pt-5">
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
              <Icon name="timer" size={13} className="text-brand" />
              Ready in
            </dt>
            <dd className="mt-1 text-[17px] font-bold tracking-[-0.02em] text-ink">
              {minutes(restaurant.etaMinutes)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
              <Icon name="bag" size={13} className="text-brand" />
              Delivery
            </dt>
            <dd className="mt-1 text-[17px] font-bold tracking-[-0.02em] text-ink">
              {cedis(deliveryQuote(restaurant))}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
              <Icon name="map-pin" size={13} className="text-brand" />
              Where
            </dt>
            <dd className="mt-1 text-[17px] font-bold tracking-[-0.02em] text-ink">
              {restaurant.neighbourhood}
            </dd>
            <dd className="mt-0.5 text-[12px] text-muted">
              {distance(restaurant.distanceKm)} away
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.07em] text-muted">
              <Icon name="star" size={13} className="text-brand" />
              Rated
            </dt>
            <dd className="mt-1 text-[17px] font-bold tracking-[-0.02em] text-ink">
              {restaurant.rating.toFixed(1)}
            </dd>
            <dd className="mt-0.5 text-[12px] text-muted">
              {restaurant.ratingCount.toLocaleString("en-GB")} ratings
            </dd>
          </div>
        </dl>

        <div className="mt-auto pt-6">
          <div className="flex items-center gap-4 rounded-[16px] border border-line/90 bg-surface p-4">
            <div
              className="w-[104px] shrink-0 rounded-[12px] bg-white p-2 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: code }}
            />
            <div className="min-w-0">
              <p className="text-[16px] font-bold tracking-[-0.015em] text-ink">Scan to order</p>
              <p className="mt-1 text-[12px] leading-snug text-muted">
                Point a camera at the code and this kitchen opens on the phone.
              </p>
              <p className="mt-1.5 truncate font-mono text-[11px] text-muted-soft">{url}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
