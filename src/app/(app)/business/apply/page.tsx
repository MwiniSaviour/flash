import type { Metadata } from "next";

import { BusinessApplicationForm } from "@/components/dashboard/BusinessApplicationForm";

export const metadata: Metadata = {
  title: "Run a business on Flash",
  description: "Apply to run a kitchen, promote events or drive for Flash.",
};

/**
 * The application.
 *
 * The way a customer becomes a business: one form, and the console opens as
 * soon as the team approves it.
 */
export default async function ApplyPage() {
  return (
    <div className="px-5 pb-8 pt-4">
      <header>
        <p className="text-[12.5px] font-medium text-muted">Run a business on Flash</p>
        <h1 className="mt-0.5 text-[27px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Apply once, run it properly
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Tell us what you run and we will open your console: post what you sell, set your prices,
          put an offer on and take the orders that come in.
        </p>
      </header>

      <div className="mt-6">
        <BusinessApplicationForm />
      </div>
    </div>
  );
}
