"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/flash/Icon";
import { Sheet } from "@/components/flash/Sheet";
import { StatusBadge } from "@/components/flash/ui";
import { cedis, dayMonth } from "@/lib/flash/format";
import {
  closeEvent,
  completeOrder,
  confirmOrder,
  confirmTicket,
  createMenuItem,
  deleteMenuItem,
  deleteTicketTier,
  publishEvent,
  updateEvent,
  updateMenuItem,
  updateTicketTier,
} from "@/lib/flash/business-actions";
import { COVER_IMAGES, EVENT_COVERS } from "@/lib/flash/covers";
import {
  activeDiscountPercent,
  discountLabel,
  discountState,
  discountWindow,
  priceAfterDiscount,
} from "@/lib/flash/pricing";
import type { ConsoleCustomer } from "@/lib/flash/repository";
import type { Event, MenuItem, Order, Ticket, TicketTier } from "@/lib/flash/types";
import { cn } from "@/lib/utils";

import { DataTable, DetailGrid, TableButton, type TableRow } from "./DataTable";
import { RecordDrawer, type DrawerField, type DrawerValues } from "./RecordDrawer";

type ActionResult = { ok: boolean; error?: string };

function useTableAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<ActionResult>) => {
    setError(null);
    start(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "That change did not save.");
        return;
      }
      router.refresh();
    });
  };

  return { run, pending, error };
}

function ConfirmDelete({
  label,
  detail,
  onConfirm,
  onCancel,
  pending,
}: {
  label: string;
  detail: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <Sheet
      title={`Delete ${label}?`}
      onClose={onCancel}
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] bg-danger text-[14px] font-bold text-white transition disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-[12px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink"
          >
            Keep it
          </button>
        </div>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-ink-soft">{detail}</p>
    </Sheet>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 text-[12.5px] text-danger-ink">
      {error}
    </p>
  );
}

const DISH_FIELDS: DrawerField[] = [
  { type: "text", name: "name", label: "Dish name" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "tags", name: "tags", label: "Tags (comma separated)" },
  { type: "number", name: "price", label: "Price (GHC)", min: 0 },
  { type: "number", name: "discountPercent", label: "Discount (%)", min: 0, max: 100 },
  { type: "date", name: "discountStartsAt", label: "Discount starts" },
  { type: "date", name: "discountEndsAt", label: "Discount expires" },
  {
    type: "image",
    name: "imageSrc",
    label: "Photograph",
    sources: COVER_IMAGES,
    uploadKind: "dish",
  },
  { type: "text", name: "imageAlt", label: "Photo description" },
];

function dishInitial(item?: MenuItem): DrawerValues {
  return {
    name: item?.name ?? "",
    description: item?.description ?? "",
    tags: (item?.tags ?? []).join(", "),
    price: item?.price ?? 0,
    discountPercent: item?.discountPercent ?? 0,
    discountStartsAt: item?.discountStartsAt ?? "",
    discountEndsAt: item?.discountEndsAt ?? "",
    imageSrc: item?.image.src ?? COVER_IMAGES[0].src,
    imageAlt: item?.image.alt ?? "",
  };
}

function DiscountCell({ item, today }: { item: MenuItem | TicketTier; today: string }) {
  const state = discountState(item, today);
  const percent = item.discountPercent ?? 0;

  if (state === "none") return <span className="text-muted-soft">None</span>;

  return (
    <span>
      <span className="block font-semibold text-ink">{discountLabel(percent)}</span>
      <span
        className={cn(
          "block text-[11px]",
          state === "active" && "text-success-ink",
          state === "scheduled" && "text-warning",
          state === "expired" && "text-muted-soft",
        )}
      >
        {discountWindow(item, today)}
      </span>
    </span>
  );
}

/** Dishes: every field editable, with create and delete. */
export function DishesTable({
  businessId,
  restaurantId,
  items,
  today,
}: {
  businessId: string;
  restaurantId: string;
  items: MenuItem[];
  today: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [removing, setRemoving] = useState<MenuItem | null>(null);
  const { run, pending, error } = useTableAction();

  const rows: TableRow[] = items.map((item) => ({
    id: item.id,
    search: `${item.name} ${item.description} ${(item.tags ?? []).join(" ")}`,
    filterValue: activeDiscountPercent(item, today) > 0 ? "Discounted" : "Listed",
    export: [
      item.name,
      (item.tags ?? []).join(" "),
      priceAfterDiscount(item.price, item, today),
      item.discountPercent ?? 0,
      discountState(item, today),
    ],
    details: (
      <DetailGrid
        items={[
          { label: "Description", value: item.description || "No description" },
          { label: "Tags", value: (item.tags ?? []).join(", ") || "None" },
          { label: "List price", value: cedis(item.price) },
          { label: "Discount", value: discountWindow(item, today) },
          {
            label: "Portions",
            value: item.sizes.map((size) => `${size.name} · ${cedis(size.price)}`).join(", "),
          },
          {
            label: "Extras",
            value: item.toppings.length
              ? item.toppings.map((topping) => topping.name).join(", ")
              : "None",
          },
        ]}
      />
    ),
    cells: [
      <span key="name" className="block">
        <span className="block font-semibold text-ink">{item.name}</span>
        <span className="block truncate text-[11.5px] text-muted">
          {item.description || "No description"}
        </span>
      </span>,
      <span key="tags" className="flex flex-wrap gap-1">
        {(item.tags ?? []).length ? (
          item.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-muted-soft">—</span>
        )}
      </span>,
      <span key="price" className="font-semibold text-ink">
        {cedis(priceAfterDiscount(item.price, item, today))}
      </span>,
      <DiscountCell key="discount" item={item} today={today} />,
      <span key="status">
        {activeDiscountPercent(item, today) > 0 ? (
          <StatusBadge tone="success" icon="lightning">
            Discounted
          </StatusBadge>
        ) : (
          <StatusBadge tone="neutral" icon="check">
            Listed
          </StatusBadge>
        )}
      </span>,
    ],
    actions: (
      <>
        <TableButton onClick={() => setEditing(item)}>Edit</TableButton>
        <TableButton tone="danger" onClick={() => setRemoving(item)}>
          Delete
        </TableButton>
      </>
    ),
  }));

  return (
    <>
      <DataTable
        id="dishes"
        title="Dishes"
        description="Everything on the menu. Select a row for the full detail."
        columns={[
          { label: "Dish" },
          { label: "Tags" },
          { label: "Price" },
          { label: "Discount" },
          { label: "Status" },
        ]}
        rows={rows}
        action={
          <TableButton tone="primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={14} /> Add dish
          </TableButton>
        }
        empty="No dishes yet. Add the first one."
      />
      <ErrorLine error={error} />

      {editing ? (
        <RecordDrawer
          title={editing === "new" ? "Add a dish" : "Edit dish"}
          fields={DISH_FIELDS}
          initial={dishInitial(editing === "new" ? undefined : editing)}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            const base = {
              businessId,
              name: String(values.name),
              description: String(values.description),
              tags: String(values.tags),
              price: Number(values.price),
              imageSrc: String(values.imageSrc),
              imageAlt: String(values.imageAlt),
              discountPercent: Number(values.discountPercent),
              discountStartsAt: String(values.discountStartsAt) || undefined,
              discountEndsAt: String(values.discountEndsAt) || undefined,
            };
            const result =
              editing === "new"
                ? await createMenuItem({ ...base, restaurantId })
                : await updateMenuItem({ ...base, menuItemId: editing.id });
            if (result.ok) router.refresh();
            return result;
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDelete
          label="dish"
          detail={`“${removing.name}” will be removed from the menu. Past orders keep its name.`}
          pending={pending}
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            run(async () => {
              const result = await deleteMenuItem({ businessId, menuItemId: removing.id });
              if (result.ok) setRemoving(null);
              return result;
            })
          }
        />
      ) : null}
    </>
  );
}

/** Orders with their status actions. */
export function OrdersTable({ orders }: { orders: Order[] }) {
  const { run, pending, error } = useTableAction();

  const rows: TableRow[] = orders.map((order) => ({
    id: order.id,
    search: `${order.number} ${order.lines.map((line) => line.name).join(" ")} ${order.address} ${order.status}`,
    filterValue: order.status,
    export: [
      order.number,
      order.placedAt.slice(0, 16).replace("T", " "),
      order.lines.map((line) => `${line.quantity}x ${line.name}`).join("; "),
      order.subtotal - order.discount + order.deliveryFee,
      order.status,
    ],
    details: (
      <DetailGrid
        items={[
          { label: "Placed", value: order.placedAt.slice(0, 16).replace("T", " ") },
          {
            label: "Items",
            value: order.lines
              .map((line) => `${line.quantity}× ${line.name} — ${cedis(line.price)}`)
              .join(", "),
          },
          { label: "Subtotal", value: cedis(order.subtotal) },
          { label: "Discount", value: cedis(order.discount) },
          { label: "Delivery", value: cedis(order.deliveryFee) },
          { label: "Total", value: cedis(order.subtotal - order.discount + order.deliveryFee) },
          { label: "Fulfilment", value: order.fulfilment.replace("_", " ") },
          { label: "Address", value: order.address || "Collected at the kitchen" },
          { label: "Rider", value: order.rider?.name || "Being assigned" },
          { label: "Reference", value: order.reference },
        ]}
      />
    ),
    cells: [
      <span key="number" className="font-semibold text-ink">
        #{order.number}
      </span>,
      <span key="items" className="block">
        <span className="block">{order.lines.map((line) => `${line.quantity}× ${line.name}`).join(", ")}</span>
        <span className="block text-[11.5px] text-muted">
          {order.fulfilment === "delivery" ? `To ${order.address}` : "Collect from the kitchen"}
        </span>
      </span>,
      <span key="total" className="font-semibold text-ink">
        {cedis(order.subtotal - order.discount + order.deliveryFee)}
      </span>,
      <span key="status">
        <StatusBadge
          tone={order.status === "delivered" ? "success" : "warning"}
          icon={order.status === "delivered" ? "check" : "clock"}
        >
          {order.status}
        </StatusBadge>
      </span>,
    ],
    actions: order.status === "awaiting confirmation" ? (
      <TableButton
        tone="primary"
        disabled={pending}
        onClick={() => run(() => confirmOrder({ orderId: order.id }))}
      >
        Accept
      </TableButton>
    ) : order.status !== "delivered" ? (
      <TableButton
        disabled={pending}
        onClick={() => run(() => completeOrder({ orderId: order.id }))}
      >
        Complete
      </TableButton>
    ) : undefined,
  }));

  return (
    <>
      <DataTable
        id="orders"
        title="Orders"
        description="Select a row to see the items, charges, rider and reference."
        columns={[
          { label: "Order" },
          { label: "Items" },
          { label: "Total" },
          { label: "Status" },
        ]}
        rows={rows}
        empty="No orders yet."
      />
      <ErrorLine error={error} />
    </>
  );
}

/** People who have ordered, with their lifetime values. */
export function CustomersTable({ customers }: { customers: ConsoleCustomer[] }) {
  return (
    <DataTable
      id="customers"
      title="Customers"
      description="Select a row for the customer's full record."
      columns={[
        { label: "Name" },
        { label: "Email" },
        { label: "Orders" },
        { label: "Spend" },
      ]}
      rows={customers.map((customer) => ({
        id: customer.id,
        search: `${customer.name} ${customer.email}`,
        export: [customer.name, customer.email, customer.orders, customer.spend],
        details: (
          <DetailGrid
            items={[
              { label: "Name", value: customer.name },
              { label: "Email", value: customer.email },
              { label: "Orders", value: customer.orders },
              { label: "Total spend", value: cedis(customer.spend) },
            ]}
          />
        ),
        cells: [
          <span key="name" className="font-semibold text-ink">{customer.name}</span>,
          <span key="email">{customer.email}</span>,
          <span key="orders">{customer.orders}</span>,
          <span key="spend" className="font-semibold text-ink">{cedis(customer.spend)}</span>,
        ],
      }))}
      empty="No customers yet."
    />
  );
}

const EVENT_FIELDS: DrawerField[] = [
  { type: "text", name: "title", label: "Event name" },
  { type: "text", name: "venue", label: "Venue" },
  { type: "text", name: "neighbourhood", label: "Neighbourhood" },
  { type: "date", name: "date", label: "Date" },
  { type: "text", name: "startTime", label: "Starts (HH:MM)" },
  { type: "text", name: "endTime", label: "Ends (HH:MM)" },
  {
    type: "image",
    name: "imageSrc",
    label: "Poster",
    sources: EVENT_COVERS,
    uploadKind: "poster",
  },
  { type: "text", name: "imageAlt", label: "Photo description" },
];

const NEW_EVENT_FIELDS: DrawerField[] = [
  ...EVENT_FIELDS,
  { type: "text", name: "tierName", label: "First ticket name" },
  { type: "number", name: "price", label: "Ticket price (GHC)", min: 0 },
  { type: "number", name: "capacity", label: "Tickets available", min: 0 },
  { type: "number", name: "discountPercent", label: "Discount (%)", min: 0, max: 100 },
  { type: "date", name: "discountStartsAt", label: "Discount starts" },
  { type: "date", name: "discountEndsAt", label: "Discount expires" },
];

/** Events: create, edit the public details, or close one without losing tickets. */
export function EventsTable({
  businessId,
  events,
  today,
}: {
  businessId: string;
  events: Event[];
  today: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [closing, setClosing] = useState<Event | null>(null);
  const { run, pending, error } = useTableAction();

  const rows: TableRow[] = events.map((event) => {
    const status = event.live ? "Live" : event.date >= today ? "Scheduled" : "Closed";

    return {
      id: event.id,
      search: `${event.title} ${event.venue} ${event.neighbourhood} ${status}`,
      filterValue: status,
      export: [event.title, event.date, event.venue, event.capacity, status],
      details: (
        <DetailGrid
          items={[
            { label: "Event", value: event.title },
            { label: "Date", value: dayMonth(event.date) },
            { label: "Time", value: `${event.startTime} – ${event.endTime}` },
            { label: "Venue", value: event.venue },
            { label: "Area", value: event.neighbourhood },
            { label: "Going", value: event.going },
            { label: "Capacity", value: event.capacity },
            { label: "Status", value: status },
          ]}
        />
      ),
      cells: [
        <span key="name" className="font-semibold text-ink">{event.title}</span>,
        <span key="date">{dayMonth(event.date)}</span>,
        <span key="venue">{event.venue}</span>,
        <span key="capacity">{event.capacity}</span>,
        <span key="status">
          <StatusBadge
            tone={status === "Live" ? "success" : status === "Scheduled" ? "warning" : "neutral"}
            icon={status === "Live" ? "check" : status === "Scheduled" ? "clock" : "info"}
          >
            {status}
          </StatusBadge>
        </span>,
      ],
      actions: (
        <>
          <TableButton onClick={() => setEditing(event)}>Edit</TableButton>
          {status !== "Closed" ? (
            <TableButton tone="danger" onClick={() => setClosing(event)}>
              Close
            </TableButton>
          ) : null}
        </>
      ),
    };
  });

  return (
    <>
      <DataTable
        id="events"
        title="Events"
        description="Select a row for the date, venue, times and attendance."
        columns={[
          { label: "Event" },
          { label: "Date" },
          { label: "Venue" },
          { label: "Capacity" },
          { label: "Status" },
        ]}
        rows={rows}
        action={
          <TableButton tone="primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} /> Post event
          </TableButton>
        }
        empty="No events yet. Post the first one."
      />
      <ErrorLine error={error} />

      {creating ? (
        <RecordDrawer
          title="Post an event"
          fields={NEW_EVENT_FIELDS}
          initial={{
            title: "",
            venue: "",
            neighbourhood: "",
            date: "",
            startTime: "18:00",
            endTime: "22:00",
            imageSrc: EVENT_COVERS[0].src,
            imageAlt: EVENT_COVERS[0].alt,
            tierName: "General Admission",
            price: 0,
            capacity: 100,
            discountPercent: 0,
            discountStartsAt: "",
            discountEndsAt: "",
          }}
          onClose={() => setCreating(false)}
          onSave={async (values) => {
            const result = await publishEvent({
              businessId,
              title: String(values.title),
              venue: String(values.venue),
              neighbourhood: String(values.neighbourhood),
              date: String(values.date),
              startTime: String(values.startTime),
              endTime: String(values.endTime),
              tierName: String(values.tierName),
              price: Number(values.price),
              capacity: Number(values.capacity),
              discountPercent: Number(values.discountPercent),
              discountStartsAt: String(values.discountStartsAt) || undefined,
              discountEndsAt: String(values.discountEndsAt) || undefined,
              imageSrc: String(values.imageSrc),
              imageAlt: String(values.imageAlt),
            });
            if (result.ok) router.refresh();
            return result;
          }}
        />
      ) : null}

      {editing ? (
        <RecordDrawer
          title="Edit event"
          fields={EVENT_FIELDS}
          initial={{
            title: editing.title,
            venue: editing.venue,
            neighbourhood: editing.neighbourhood,
            date: editing.date,
            startTime: editing.startTime,
            endTime: editing.endTime,
            imageSrc: editing.image.src,
            imageAlt: editing.image.alt,
          }}
          onClose={() => setEditing(null)}
          onSave={(values) =>
            updateEvent({
              businessId,
              eventId: editing.id,
              title: String(values.title),
              venue: String(values.venue),
              neighbourhood: String(values.neighbourhood),
              date: String(values.date),
              startTime: String(values.startTime),
              endTime: String(values.endTime),
              imageSrc: String(values.imageSrc),
              imageAlt: String(values.imageAlt),
            })
          }
        />
      ) : null}

      {closing ? (
        <ConfirmDelete
          label="event"
          detail={`“${closing.title}” will be taken off the live list. Its tickets and sales history stay.`}
          pending={pending}
          onCancel={() => setClosing(null)}
          onConfirm={() =>
            run(async () => {
              const result = await closeEvent({ businessId, eventId: closing.id });
              if (result.ok) setClosing(null);
              return result;
            })
          }
        />
      ) : null}
    </>
  );
}

const TIER_FIELDS: DrawerField[] = [
  { type: "text", name: "name", label: "Ticket name" },
  { type: "number", name: "price", label: "Price (GHC)", min: 0 },
  { type: "number", name: "available", label: "Tickets available", min: 0 },
  { type: "number", name: "discountPercent", label: "Discount (%)", min: 0, max: 100 },
  { type: "date", name: "discountStartsAt", label: "Discount starts" },
  { type: "date", name: "discountEndsAt", label: "Discount expires" },
];

/** Ticket types: price, room and scheduled discounts. */
export function TiersTable({
  businessId,
  events,
  today,
}: {
  businessId: string;
  events: Event[];
  today: string;
}) {
  const [editing, setEditing] = useState<{ event: Event; tier: TicketTier } | null>(null);
  const [removing, setRemoving] = useState<{ event: Event; tier: TicketTier } | null>(null);
  const { run, pending, error } = useTableAction();

  const rows: TableRow[] = events.flatMap((event) =>
    event.tiers.map((tier) => ({
      id: tier.id,
      search: `${tier.name} ${event.title}`,
      filterValue: discountState(tier, today),
      export: [
        tier.name,
        event.title,
        tier.price,
        tier.available,
        tier.discountPercent ?? 0,
        discountWindow(tier, today),
      ],
      details: (
        <DetailGrid
          items={[
            { label: "Ticket", value: tier.name },
            { label: "Event", value: event.title },
            { label: "List price", value: cedis(tier.price) },
            { label: "Price today", value: cedis(priceAfterDiscount(tier.price, tier, today)) },
            { label: "Available", value: tier.available },
            { label: "Discount", value: discountWindow(tier, today) },
            { label: "Perks", value: tier.perks.join(", ") || "None" },
          ]}
        />
      ),
      cells: [
        <span key="name" className="block">
          <span className="block font-semibold text-ink">{tier.name}</span>
          <span className="block text-[11.5px] text-muted">{event.title}</span>
        </span>,
        <span key="price" className="font-semibold text-ink">
          {cedis(priceAfterDiscount(tier.price, tier, today))}
        </span>,
        <span key="available">{tier.available}</span>,
        <DiscountCell key="discount" item={tier} today={today} />,
      ],
      actions: (
        <>
          <TableButton onClick={() => setEditing({ event, tier })}>Edit</TableButton>
          <TableButton tone="danger" onClick={() => setRemoving({ event, tier })}>
            Delete
          </TableButton>
        </>
      ),
    })),
  );

  return (
    <>
      <DataTable
        id="ticket-types"
        title="Ticket types"
        description="Select a row for the list price, discount window and perks."
        columns={[
          { label: "Ticket" },
          { label: "Price" },
          { label: "Available" },
          { label: "Discount" },
        ]}
        rows={rows}
        empty="No ticket types yet."
      />
      <ErrorLine error={error} />

      {editing ? (
        <RecordDrawer
          title="Edit ticket type"
          fields={TIER_FIELDS}
          initial={{
            name: editing.tier.name,
            price: editing.tier.price,
            available: editing.tier.available,
            discountPercent: editing.tier.discountPercent ?? 0,
            discountStartsAt: editing.tier.discountStartsAt ?? "",
            discountEndsAt: editing.tier.discountEndsAt ?? "",
          }}
          onClose={() => setEditing(null)}
          onSave={(values) =>
            updateTicketTier({
              businessId,
              tierId: editing.tier.id,
              name: String(values.name),
              price: Number(values.price),
              available: Number(values.available),
              discountPercent: Number(values.discountPercent),
              discountStartsAt: String(values.discountStartsAt) || undefined,
              discountEndsAt: String(values.discountEndsAt) || undefined,
            })
          }
        />
      ) : null}

      {removing ? (
        <ConfirmDelete
          label="ticket type"
          detail={`“${removing.tier.name}” will be removed. Tickets already sold keep their name.`}
          pending={pending}
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            run(async () => {
              const result = await deleteTicketTier({ businessId, tierId: removing.tier.id });
              if (result.ok) setRemoving(null);
              return result;
            })
          }
        />
      ) : null}
    </>
  );
}

/** Tickets with confirmation. */
export function TicketsTable({ tickets, events }: { tickets: Ticket[]; events: Event[] }) {
  const { run, pending, error } = useTableAction();

  const rows: TableRow[] = tickets.map((ticket) => {
    const event = events.find((entry) => entry.id === ticket.eventId);

    return {
      id: ticket.id,
      search: `${ticket.reference} ${event?.title ?? ""} ${ticket.tierName} ${ticket.status}`,
      filterValue: ticket.status,
      export: [
        ticket.reference,
        new Date(ticket.purchasedAt).toLocaleDateString("en-GB"),
        event?.title ?? "",
        ticket.tierName,
        ticket.quantity,
        ticket.status,
      ],
      details: (
        <DetailGrid
          items={[
            { label: "Reference", value: ticket.reference },
            { label: "Purchased", value: new Date(ticket.purchasedAt).toLocaleString("en-GB") },
            { label: "Event", value: event?.title ?? "Event" },
            { label: "Ticket", value: ticket.tierName },
            { label: "Quantity", value: ticket.quantity },
            { label: "Status", value: ticket.status },
          ]}
        />
      ),
      cells: [
        <span key="buyer" className="block">
          <span className="block font-semibold text-ink">{ticket.reference}</span>
          <span className="block text-[11.5px] text-muted">
            {new Date(ticket.purchasedAt).toLocaleDateString("en-GB")}
          </span>
        </span>,
        <span key="event">{event?.title ?? "Event"}</span>,
        <span key="tier">{ticket.tierName}</span>,
        <span key="quantity">{ticket.quantity}</span>,
        <span key="status">
          <StatusBadge
            tone={ticket.status === "confirmed" ? "success" : "warning"}
            icon={ticket.status === "confirmed" ? "check" : "clock"}
          >
            {ticket.status}
          </StatusBadge>
        </span>,
      ],
      actions: ticket.status === "pending" ? (
        <TableButton
          tone="primary"
          disabled={pending}
          onClick={() => run(() => confirmTicket({ ticketId: ticket.id }))}
        >
          Confirm
        </TableButton>
      ) : undefined,
    };
  });

  return (
    <>
      <DataTable
        id="tickets"
        title="Tickets"
        description="Select a row for the booking reference, purchase date and status."
        columns={[
          { label: "Booking" },
          { label: "Event" },
          { label: "Ticket" },
          { label: "Qty" },
          { label: "Status" },
        ]}
        rows={rows}
        empty="No tickets yet."
      />
      <ErrorLine error={error} />
    </>
  );
}

/** Attendees from the tickets, without inventing new people. */
export function AttendeesTable({ customers }: { customers: ConsoleCustomer[] }) {
  return (
    <DataTable
      id="attendees"
      title="Attendees"
      description="Select a row for the attendee's tickets and booking value."
      columns={[
        { label: "Name" },
        { label: "Email" },
        { label: "Tickets" },
        { label: "Value" },
      ]}
      rows={customers.map((customer) => ({
        id: customer.id,
        search: `${customer.name} ${customer.email}`,
        export: [customer.name, customer.email, customer.tickets, customer.spend],
        details: (
          <DetailGrid
            items={[
              { label: "Name", value: customer.name },
              { label: "Email", value: customer.email },
              { label: "Tickets", value: customer.tickets },
              { label: "Bookings", value: customer.orders },
              { label: "Value", value: cedis(customer.spend) },
            ]}
          />
        ),
        cells: [
          <span key="name" className="font-semibold text-ink">{customer.name}</span>,
          <span key="email">{customer.email}</span>,
          <span key="tickets">{customer.tickets}</span>,
          <span key="value" className="font-semibold text-ink">{cedis(customer.spend)}</span>,
        ],
      }))}
      empty="No attendees yet."
    />
  );
}
