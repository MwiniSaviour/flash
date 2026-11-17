import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware class merge — same helper contract as the web app. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
