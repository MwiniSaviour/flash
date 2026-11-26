import type { Metadata } from "next";

import { BookingLedger } from "@/components/bookings/BookingLedger";
import { listBookings, listEvents, listTickets } from "@/lib/flash/repository";

export const metadata: Metadata = {
  title: "Bookings",
  description: "Every ticket, ride and order you have made with ScalDive.",
};

export default async function BookingsPage() {
  const [bookings, tickets, events] = await Promise.all([
    listBookings(),
    listTickets(),
    listEvents(),
  ]);

  return <BookingLedger bookings={bookings} tickets={tickets} events={events} />;
}
