/**
 * Short surface copy for validation errors, plus the form control each one
 * belongs to. Actions keep their full, honest sentences; the toast shows one
 * short line and the form jumps to the control that needs attention.
 *
 * A message that is not in the map keeps its original text and shows no field,
 * so new or server-side errors still surface without guesswork.
 */

const ERRORS: Record<string, { message: string; field?: string }> = {
  "Add a pick-up and a drop-off.": { message: "Add both locations", field: "pickup" },
  "Choose a pick-up date and time.": { message: "Pick a date and time", field: "schedule" },
  "Add a phone number so the rider can reach you.": { message: "Phone number needed", field: "phone" },
  "Add a phone number so the courier can reach the recipient.": {
    message: "Recipient phone needed",
    field: "phone",
  },
  "Add the name of the person receiving this parcel.": { message: "Recipient name needed", field: "recipient" },
  "Choose what you are sending.": { message: "Choose a parcel type", field: "parcelType" },
  "Add a delivery address.": { message: "Delivery address needed", field: "address" },
  "Tell us who wants the ticket.": { message: "Add a name", field: "name" },
  "Tell us the name of the business.": { message: "Business name needed", field: "name" },
  "We need an email to reach you on.": { message: "Email needed", field: "email" },
  "Give the dish a name.": { message: "Dish name needed", field: "name" },
  "Set a price for the dish.": { message: "Set a price", field: "price" },
  "Give the event a name.": { message: "Event name needed", field: "name" },
  "Where is it happening?": { message: "Venue needed", field: "venue" },
  "Pick the date.": { message: "Pick a date", field: "date" },
  "Set a price for the tickets.": { message: "Set a price", field: "price" },
  "An offer runs between 0 and 100 percent.": {
    message: "Offer must be 0–100%",
    field: "discountPercent",
  },
  "Every value must be a whole number.": { message: "Use whole numbers" },
  "The hold window cannot exceed 720 hours.": { message: "Maximum 720 hours", field: "holdHours" },
  "A rate cannot exceed 100 percent.": { message: "Maximum 100%", field: "rate" },
  "Sign in to book a ticket.": { message: "Sign in to continue" },
  "Sign in to ask for a ticket.": { message: "Sign in to continue" },
  "Sign in to place an order.": { message: "Sign in to continue" },
  "Sign in to book a ride.": { message: "Sign in to continue" },
  "Sign in to send a parcel.": { message: "Sign in to continue" },
  "Sign in to apply.": { message: "Sign in to continue" },
  "Sign in to book tickets.": { message: "Sign in to continue" },
  "Sign in to confirm a delivery.": { message: "Sign in to continue" },
  "Your bag is empty.": { message: "Your bag is empty" },
  "Choose at least one ticket.": { message: "Choose a ticket" },
  "That ticket is no longer available.": { message: "Ticket unavailable" },
  "That ticket is no longer on sale.": { message: "Ticket unavailable" },
  "Ticket sales for this tier are closed.": { message: "Sales closed" },
  "That kitchen is no longer available.": { message: "Kitchen unavailable" },
  "One of those items is no longer on the menu.": { message: "Menu item unavailable" },
  "That ride is no longer available.": { message: "Ride unavailable" },
  "You already have a request in for this tier.": { message: "Request already sent" },
  "We could not start the payment. No ticket was booked.": { message: "Payment didn't start" },
  "We could not start the payment. No order was placed.": { message: "Payment didn't start" },
  "We could not start the payment. No ride was booked.": { message: "Payment didn't start" },
  "We could not start the payment. No parcel was booked.": { message: "Payment didn't start" },
  "We could not start the payment. No tickets were booked.": { message: "Payment didn't start" },
  "We could not place that order. Try again.": { message: "Couldn't place order — try again" },
  "We could not book that ride. Try again.": { message: "Couldn't book ride — try again" },
  "We could not book that courier. Try again.": { message: "Couldn't book courier — try again" },
  "We could not save your request. Try again.": { message: "Couldn't save request — try again" },
  "That photograph is not yours to use.": { message: "That image isn't yours to use" },
};

export function shortError(message: string): string | undefined {
  return ERRORS[message]?.message;
}

export function fieldForError(message: string): string | undefined {
  return ERRORS[message]?.field;
}

export function describeError(message: string): { message: string; field?: string } {
  return { message: shortError(message) ?? message, field: fieldForError(message) };
}
