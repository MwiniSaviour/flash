import { listBookings, listTickets } from "@/lib/flash/repository";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center px-3 py-3.5">
      <span className="text-[20px] font-bold tracking-[-0.02em] text-ink">{value}</span>
      <span className="mt-0.5 text-[12.5px] text-muted">{label}</span>
    </div>
  );
}

/** The account's three numbers: how many things are moving or spent. */
export async function ProfileStats() {
  const [tickets, bookings] = await Promise.all([listTickets(), listBookings()]);

  return (
    <section className="mt-5 grid grid-cols-3 border-y border-line/70 bg-surface/50">
      <Stat label="Tickets" value={tickets.reduce((total, ticket) => total + ticket.quantity, 0)} />
      <Stat label="Orders" value={bookings.filter((booking) => booking.kind === "order").length} />
      <Stat label="Rides" value={bookings.filter((booking) => booking.kind === "ride").length} />
    </section>
  );
}
