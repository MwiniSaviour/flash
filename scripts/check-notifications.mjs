import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const problems = [];
const expect = (condition, message) => {
  if (!condition) problems.push(message);
};

expect(
  existsSync(resolve(root, "supabase/migrations/20261121120000_notifications.sql")),
  "missing notifications migration",
);
expect(
  read(".env.example").includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY="),
  "VAPID key not documented",
);
expect(
  read(".env.example").includes("FCM_SERVICE_ACCOUNT_JSON="),
  "FCM credential not documented",
);
expect(read(".env.example").includes("RESEND_API_KEY="), "Resend key not documented");

for (const [file, needle] of [
  ["src/lib/flash/actions.ts", "notifyPurchaseConfirmed"],
  ["src/lib/flash/actions.ts", "notifyVendorNewOrder"],
  ["src/lib/flash/actions.ts", "notifyManagerNewSale"],
  ["src/lib/payments/service.ts", "notifyPaymentReceived"],
  ["src/lib/payments/service.ts", "notifyCompletion"],
  ["src/app/layout.tsx", "PushRegistrationBridge"],
]) {
  expect(read(file).includes(needle), `${file} is missing ${needle}`);
}

if (problems.length) {
  console.error(`Notification check failed:\n${problems.map((p) => ` - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log("Notifications check passed.");
