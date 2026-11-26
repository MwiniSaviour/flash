import { redirect } from "next/navigation";

// The superadmin UI now lives in ScalMart's admin dashboard, with a project
// switcher that scopes the same ops API to Flash. This route is kept only so
// existing bookmarks and the admin host keep working.
const DEFAULT_ADMIN_URL = "https://scalmart.scalmint.com/admin";

export const dynamic = "force-dynamic";

export default function AdminRedirect() {
  const base = (process.env.NEXT_PUBLIC_SCALMART_ADMIN_URL ?? DEFAULT_ADMIN_URL).replace(/\/+$/, "");
  redirect(`${base}?project=flash`);
}
