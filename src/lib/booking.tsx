"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ParcelBooking } from "@/components/booking/ParcelBooking";
import { RideBooking } from "@/components/booking/RideBooking";
import type { TransportRates } from "@/lib/flash/pricing";
import type { RideQuote, SavedPlace } from "@/lib/flash/types";

export type BookingKind = "ride" | "parcel";

export interface BookingRequest {
  kind: BookingKind;
  /** An opening drop-off, when the sheet opens from a named trip. */
  dropoff?: string;
}

interface BookingApi {
  open: (request: BookingRequest) => void;
  close: () => void;
}

const BookingContext = createContext<BookingApi | null>(null);

/**
 * The booking sheet.
 *
 * Booking a ride or sending a parcel is a short task, so it happens in a sheet
 * over the screen the customer came from instead of on a page of its own:
 * nothing behind the sheet is lost, and closing it puts them back where they
 * were. The screen that opened the sheet keeps its own state, and the sheet
 * closes itself if the customer navigates away underneath it.
 */
export function useBooking(): BookingApi {
  const api = useContext(BookingContext);

  if (!api) {
    throw new Error("useBooking must be called inside <BookingProvider>.");
  }

  return api;
}

export function BookingProvider({
  children,
  quote,
  savedPlaces,
  rates,
}: {
  children: ReactNode;
  quote: RideQuote;
  savedPlaces: SavedPlace[];
  rates: TransportRates;
}) {
  const [request, setRequest] = useState<BookingRequest | null>(null);

  const open = useCallback((next: BookingRequest) => {
    setRequest(next);
  }, []);

  const close = useCallback(() => {
    setRequest(null);
  }, []);

  const api = useMemo(() => ({ open, close }), [open, close]);

  return (
    <BookingContext.Provider value={api}>
      {children}

      {request?.kind === "ride" ? (
        <RideBooking
          quote={quote}
          savedPlaces={savedPlaces}
          rates={rates}
          initialDropoff={request.dropoff}
          onClose={close}
        />
      ) : null}

      {request?.kind === "parcel" ? (
        <ParcelBooking savedPlaces={savedPlaces} rates={rates} onClose={close} />
      ) : null}
    </BookingContext.Provider>
  );
}
