"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { safeReturnPath, signInHref, signUpHref } from "@/lib/auth/return-to";

function Callback() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeReturnPath(params.get("redirect_url") ?? undefined);

  return (
    <HandleSSOCallback
      navigateToApp={() => router.push(returnTo)}
      navigateToSignIn={() => router.push(signInHref(returnTo))}
      navigateToSignUp={() => router.push(signUpHref(returnTo))}
    />
  );
}

/** Completes Google sign-in without rendering any Clerk interface. */
export default function SsoCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}
