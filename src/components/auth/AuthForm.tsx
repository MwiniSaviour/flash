"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FlashLogo } from "@/components/flash/FlashLogo";
import { Icon } from "@/components/flash/Icon";
import { signInHref, signUpHref } from "@/lib/auth/return-to";

import { GoogleMark } from "./GoogleMark";

function clerkError(error: unknown): string {
  const err = error as { errors?: { message?: string }[]; message?: string; longMessage?: string } | null;
  return err?.errors?.[0]?.message ?? err?.longMessage ?? err?.message ?? "Something went wrong. Try again.";
}

const INPUT =
  "h-11 w-full rounded-[11px] border border-line bg-paper px-3 text-[13.5px] text-ink placeholder:text-muted focus:border-brand/50 focus:outline-none";

/**
 * Flash's own account forms.
 *
 * Clerk supplies the session and the OAuth redirect, but no Clerk interface is
 * rendered: no hosted page, no instance name, no external sign-up hop.
 */
export function AuthForm({
  mode,
  returnTo,
}: {
  mode: "sign-in" | "sign-up";
  returnTo: string;
}) {
  const router = useRouter();
  const signInAuth = useSignIn();
  const signUpAuth = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "code">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignIn = mode === "sign-in";
  const signIn = signInAuth.signIn;
  const signUp = signUpAuth.signUp;

  async function finish(complete: boolean) {
    if (!complete) {
      setError("This account needs another verification step. Check your email.");
      return;
    }
    if (isSignIn) await signIn.finalize();
    else await signUp.finalize();
    router.push(returnTo);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!signIn && !signUp) return;
    setBusy(true);

    try {
      if (isSignIn) {
        const { error: failure } = await signIn.password({
          identifier: email.trim(),
          password,
        });
        if (failure) throw failure;
        await finish(signIn.status === "complete");
      } else if (stage === "form") {
        const parts = name.trim().split(/\s+/);
        const { error: failure } = await signUp.create({
          emailAddress: email.trim(),
          password,
          firstName: parts[0],
          lastName: parts.slice(1).join(" ") || undefined,
        });
        if (failure) throw failure;

        if (signUp.status === "complete") {
          await finish(true);
        } else {
          const sent = await signUp.verifications.sendEmailCode();
          if (sent.error) throw sent.error;
          setStage("code");
        }
      } else {
        const { error: failure } = await signUp.verifications.verifyEmailCode({
          code: code.trim(),
        });
        if (failure) throw failure;
        if (signUp.status === "complete") await finish(true);
        else setError("That code did not work. Check it and try again.");
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      if (isSignIn) {
        const { error: failure } = await signIn.sso({
          strategy: "oauth_google",
          redirectUrl: returnTo,
          redirectCallbackUrl: "/sign-in/sso-callback",
        });
        if (failure) throw failure;
      } else {
        const { error: failure } = await signUp.sso({
          strategy: "oauth_google",
          redirectUrl: returnTo,
          redirectCallbackUrl: "/sign-in/sso-callback",
        });
        if (failure) throw failure;
      }
    } catch (err) {
      setError(clerkError(err));
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-6 flex justify-center">
        <FlashLogo size="sm" />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-raised">
        <div className="px-7 pb-6 pt-7">
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-ink">
            {isSignIn ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-[13px] leading-snug text-muted">
            {isSignIn
              ? "Sign in to book, order and send parcels."
              : "One account for tickets, rides and food."}
          </p>

          <button
            type="button"
            onClick={() => void google()}
            disabled={busy}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-[11px] border border-line bg-surface text-[13.5px] font-semibold text-ink transition hover:bg-surface-2 disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-muted-soft">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            {stage === "code" ? (
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-muted">
                  Verification code
                </span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className={INPUT}
                />
                <span className="mt-1.5 block text-[12px] leading-snug text-muted">
                  We sent a code to {email}. Enter it to finish signing up.
                </span>
              </label>
            ) : (
              <>
                {!isSignIn ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-muted">
                      Full name
                    </span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Saviour Mwini"
                      autoComplete="name"
                      required
                      className={INPUT}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-muted">
                    Email address
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={INPUT}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-muted">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    required
                    className={INPUT}
                  />
                </label>
              </>
            )}

            {error ? (
              <p role="alert" className="text-[12.5px] leading-snug text-danger-ink">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-brand-solid text-[14px] font-bold text-white shadow-brand transition hover:bg-brand-solid-hover disabled:opacity-60"
            >
              {busy
                ? "One moment…"
                : stage === "code"
                  ? "Verify and continue"
                  : isSignIn
                    ? "Sign in"
                    : "Create account"}
              <Icon name="arrow-right" size={16} />
            </button>
          </form>
        </div>

        <div className="border-t border-line/70 bg-surface-2/40 px-7 py-4 text-center text-[12.5px] text-muted">
          {isSignIn ? (
            <>
              Don&rsquo;t have an account?{" "}
              <Link href={signUpHref(returnTo)} className="font-bold text-brand-ink">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={signInHref(returnTo)} className="font-bold text-brand-ink">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
