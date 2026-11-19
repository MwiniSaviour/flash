import type { Metadata } from "next";

import { ProfilePageHeader } from "@/components/dashboard/ProfilePageHeader";
import { Icon } from "@/components/flash/Icon";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Help & Support" };

const FAQ = [
  {
    question: "Where are my tickets?",
    answer:
      "Open My Tickets from your profile. Each pass carries a scannable code for the gate — open it from the ticket itself.",
  },
  {
    question: "How do I change or cancel a booking?",
    answer:
      "Open the booking in My Bookings. If the service has not started, the actions on the booking tell you what you can still change.",
  },
  {
    question: "How do I add a place I go to often?",
    answer:
      "Open Saved places from your profile and add the name and address. The place then appears as a shortcut when you book a ride.",
  },
  {
    question: "When will I be charged?",
    answer:
      "Payment is taken at checkout. Your charges and their status are listed in Transaction history from your profile.",
  },
  {
    question: "How do I get a receipt?",
    answer:
      "Open the booking or ticket from My Bookings or My Tickets. Each confirmation carries its reference for your records.",
  },
];

export default function HelpPage() {
  const supportEmail = getEnv().supportEmail;

  return (
    <>
      <ProfilePageHeader
        title="Help & Support"
        subtitle="Answers to the questions customers ask most."
      />

      <section className="mt-5 px-5">
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="group rounded-[14px] border border-line/90 bg-surface p-3.5"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-[13.5px] font-semibold text-ink">
                {item.question}
                <Icon
                  name="chevron-down"
                  size={16}
                  className="shrink-0 text-muted-soft transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="rounded-[16px] border border-line/90 bg-surface p-4">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
            <Icon name="help" size={19} />
          </span>
          <p className="mt-3 text-[14px] font-bold text-ink">Still stuck?</p>
          <p className="mt-1 text-[12.5px] leading-snug text-muted">
            Send the details of what happened and the reference from your booking.
          </p>
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 inline-flex h-10 items-center rounded-[11px] bg-brand-solid px-4 text-[13px] font-bold text-white"
            >
              Email support
            </a>
          ) : (
            <p className="mt-3 text-[12.5px] text-muted">
              Support contact is not configured for this deployment.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
