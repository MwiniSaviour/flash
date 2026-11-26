import { AuthForm } from "@/components/auth/AuthForm";
import { safeReturnPath } from "@/lib/auth/return-to";
import { hasClerkEnv } from "@/lib/env";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.redirect_url);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 py-10">
      {hasClerkEnv() ? (
        <AuthForm mode="sign-in" returnTo={returnTo} />
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
            Back to ScalDive
          </Link>
        </div>
      )}
    </main>
  );
}
