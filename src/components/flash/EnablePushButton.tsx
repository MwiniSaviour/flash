"use client";

import { useState } from "react";

import { subscribeWebPush } from "@/lib/notifications/client";
import { registerFirebasePush } from "@/lib/notifications/firebase";

export function EnablePushButton() {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  return (
    <button
      type="button"
      disabled={state === "working" || state === "done"}
      onClick={async () => {
        setState("working");
        const web = await subscribeWebPush(true);
        const fcm = await registerFirebasePush();
        const ok = web || fcm;
        setState(ok ? "done" : "error");
      }}
      className="h-9 rounded-[10px] bg-brand-solid px-3 text-[12.5px] font-semibold text-white disabled:opacity-60"
    >
      {state === "done" ? "Alerts on" : state === "error" ? "Try again" : "Turn on browser alerts"}
    </button>
  );
}
