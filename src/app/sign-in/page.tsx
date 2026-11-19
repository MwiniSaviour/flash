import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { hasClerkEnv } from "@/lib/env";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 py-10">
      {hasClerkEnv() ? (
        <SignIn />
      ) : (
        <div className="max-w-sm text-center">
          <p className="text-[17px] font-bold text-ink">Sign-in is not configured</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Authentication is not connected to this deployment.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-10 items-center rounded-[11px] bg-brand-solid px-4 text-[13px] font-bold text-white"
          >
            Back to Flash
          </Link>
        </div>
      )}
    </main>
  );
}
