"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable, TableButton, type TableRow } from "@/components/dashboard/DataTable";
import { RecordDrawer, type DrawerField, type DrawerValues } from "@/components/dashboard/RecordDrawer";
import { ScreenHeader } from "@/components/flash/ui";
import { cedis, relativeDay } from "@/lib/flash/format";
import { saveProduct, type ProductKind } from "@/lib/flash/product-actions";
import type { Event, Restaurant } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

/**
 * One place for a seller to manage what they sell.
 *
 * The table and the drawer are shared console primitives; this screen only
 * supplies the product fields and the rows the signed-in seller owns.
 */

const eventFields: DrawerField[] = [
  { type: "text", name: "title", label: "Event title" },
  { type: "text", name: "subtitle", label: "Short line" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "text", name: "venue", label: "Venue" },
  { type: "text", name: "neighbourhood", label: "Area" },
  { type: "text", name: "city", label: "City" },
  { type: "date", name: "event_date", label: "Date" },
  { type: "text", name: "start_time", label: "Starts (HH:MM)" },
  { type: "text", name: "end_time", label: "Ends (HH:MM)" },
  { type: "number", name: "price_from", label: "Price from (GHC)" },
  { type: "number", name: "capacity", label: "Capacity" },
  { type: "tags", name: "categories", label: "Categories" },
  { type: "image", name: "image_src", label: "Cover image", sources: [], uploadKind: "poster" },
  { type: "text", name: "image_alt", label: "Image description" },
];

const restaurantFields: DrawerField[] = [
  { type: "text", name: "name", label: "Kitchen name" },
  { type: "text", name: "tagline", label: "Short line" },
  { type: "text", name: "cuisine", label: "Cuisine" },
  { type: "text", name: "neighbourhood", label: "Area" },
  { type: "number", name: "delivery_fee", label: "Delivery fee (GHC)" },
  { type: "number", name: "eta_minutes", label: "Delivery time (min)" },
  { type: "number", name: "distance_km", label: "Distance (km)" },
  { type: "image", name: "image_src", label: "Cover image", sources: [], uploadKind: "dish" },
  { type: "text", name: "image_alt", label: "Image description" },
];

function eventInitial(event?: Event): DrawerValues {
  return {
    ...(event?.id ? { id: event.id } : {}),
    title: event?.title ?? "",
    subtitle: event?.subtitle ?? "",
    description: event?.description ?? "",
    venue: event?.venue ?? "",
    neighbourhood: event?.neighbourhood ?? "",
    city: event?.city ?? "Wa",
    event_date: event?.date ?? "",
    start_time: event?.startTime ?? "",
    end_time: event?.endTime ?? "",
    price_from: event?.priceFrom ?? 0,
    capacity: event?.capacity ?? 0,
    categories: event?.categories.join(", ") ?? "",
    image_src: event?.image.src ?? "",
    image_alt: event?.image.alt ?? "",
    trending: event?.trending ? 1 : 0,
    live: event?.live ? 1 : 0,
  };
}

function restaurantInitial(restaurant?: Restaurant): DrawerValues {
  return {
    ...(restaurant?.id ? { id: restaurant.id } : {}),
    name: restaurant?.name ?? "",
    tagline: restaurant?.tagline ?? "",
    cuisine: restaurant?.cuisine ?? "",
    neighbourhood: restaurant?.neighbourhood ?? "Wa",
    delivery_fee: restaurant?.deliveryFee ?? 0,
    eta_minutes: restaurant?.etaMinutes ?? 0,
    distance_km: restaurant?.distanceKm ?? 0,
    image_src: restaurant?.image.src ?? "",
    image_alt: restaurant?.image.alt ?? "",
  };
}

export function SellerProducts({ events, restaurants }: { events: Event[]; restaurants: Restaurant[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<ProductKind>("event");
  const [editing, setEditing] = useState<DrawerValues | null>(null);

  const rows: TableRow[] = useMemo(
    () =>
      kind === "event"
        ? events.map((event) => ({
            id: event.id,
            search: `${event.title} ${event.venue} ${event.city}`,
            filterValue: event.city,
            export: [event.title, event.city, event.date, event.priceFrom],
            cells: [
              <span key="title" className="block text-[14px] font-semibold text-ink">{event.title}</span>,
              <span key="city" className="text-[12.5px] text-muted">{event.city}</span>,
              <span key="when" className="text-[12.5px] text-muted">{relativeDay(event.date)}</span>,
              <span key="price" className="text-[12.5px] text-ink">{cedis(event.priceFrom)}</span>,
            ],
            actions: (
              <div className="space-y-1.5">
                <TableButton tone="primary" onClick={() => setEditing(eventInitial(event))}>Edit</TableButton>
                <TableButton
                  onClick={() => {
                    void saveProduct("event", { ...eventInitial(event), trending: 0, live: 0 }).then(() => router.refresh());
                  }}
                >
                  Unlist
                </TableButton>
              </div>
            ),
          }))
        : restaurants.map((restaurant) => ({
            id: restaurant.id,
            search: `${restaurant.name} ${restaurant.cuisine} ${restaurant.neighbourhood}`,
            filterValue: restaurant.neighbourhood,
            export: [restaurant.name, restaurant.cuisine, restaurant.neighbourhood, restaurant.deliveryFee],
            cells: [
              <span key="name" className="block text-[14px] font-semibold text-ink">{restaurant.name}</span>,
              <span key="cuisine" className="text-[12.5px] text-muted">{restaurant.cuisine}</span>,
              <span key="area" className="text-[12.5px] text-muted">{restaurant.neighbourhood}</span>,
              <span key="fee" className="text-[12.5px] text-ink">{cedis(restaurant.deliveryFee)}</span>,
            ],
            actions: (
              <TableButton tone="primary" onClick={() => setEditing(restaurantInitial(restaurant))}>Edit</TableButton>
            ),
          })),
    [events, restaurants, kind, router],
  );

  return (
    <div className="pb-5">
      <ScreenHeader title="My products" subtitle="Create and manage the products you sell." className="pt-2" />

      <div className="mt-4 flex gap-2 px-5">
        {(["event", "restaurant"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-semibold transition",
              kind === item ? "bg-brand-solid text-white" : "border border-line bg-surface text-muted",
            )}
          >
            {item === "event" ? "Events" : "Kitchens"}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        <DataTable
          title={kind === "event" ? "Your events" : "Your kitchens"}
          columns={[
            { label: "Product" },
            { label: kind === "event" ? "City" : "Cuisine" },
            { label: "Area" },
            { label: "Price" },
          ]}
          rows={rows}
          empty="Nothing here yet. Add your first product."
          action={
            <TableButton tone="primary" onClick={() => setEditing(kind === "event" ? eventInitial() : restaurantInitial())}>
              Add {kind === "event" ? "event" : "kitchen"}
            </TableButton>
          }
        />
      </div>

      {editing ? (
        <RecordDrawer
          title={editing.id ? "Edit product" : "New product"}
          fields={kind === "event" ? eventFields : restaurantFields}
          initial={editing}
          onSave={async (values) => {
            const result = await saveProduct(kind, values);
            if (result.ok) router.refresh();
            return result;
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
