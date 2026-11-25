import { BottomNav } from "@/components/flash/BottomNav";
import { RightRail } from "@/components/flash/RightRail";
import { SideRail } from "@/components/flash/SideRail";
import { TopBar } from "@/components/flash/TopBar";
import { CartProvider } from "@/lib/cart";
import { BookingProvider } from "@/lib/booking";
import { LocationProvider } from "@/components/flash/LocationProvider";
import {
  getCurrentUser,
  getRideQuote,
  getSavedPlaces,
} from "@/lib/flash/repository";
import { platformSettings } from "@/lib/payments/commission";

/**
 * Every screen in Flash reads the database, so nothing here can be
 * prerendered: a ticket booked at 10:00 has to show up on the Bookings screen
 * at 10:01, not at the next build.
 */
export const dynamic = "force-dynamic";

/**
 * The Flash shell.
 *
 * On the phone this is a single column with a fixed bottom tab bar. From `lg`
 * the same content is re-composed into the desktop idiom the product asked for:
 * a left navigation rail, a central column and a right rail — no stretched
 * phone frame, no duplicated navigation.
 *
 * The booking sheet lives here too: booking a ride or sending a parcel opens
 * over the screen the customer came from, so the quote and the saved places
 * are read once for the whole app.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, quote, savedPlaces, settings] = await Promise.all([
    getCurrentUser(),
    getRideQuote(),
    getSavedPlaces(),
    platformSettings(),
  ]);

  return (
    <LocationProvider>
    <CartProvider>
      <BookingProvider quote={quote} savedPlaces={savedPlaces} rates={settings}>
        <div className="min-h-dvh">
          <div className="mx-auto flex w-full max-w-[1440px]">
            <SideRail user={user} />

            <div className="min-w-0 flex-1">
              <TopBar user={user} />

              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:px-6">
                <main
                  id="main-content"
                  className="mx-auto w-full min-w-0 max-w-[680px] overflow-x-hidden pb-[calc(96px+env(safe-area-inset-bottom,0px))] lg:pb-16"
                >
                  {children}
                </main>

                <RightRail />
              </div>
            </div>
          </div>

          <BottomNav />
        </div>
      </BookingProvider>
    </CartProvider>
    </LocationProvider>
  );
}
