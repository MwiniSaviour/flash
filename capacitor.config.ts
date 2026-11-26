import type { CapacitorConfig } from "@capacitor/cli";

/**
 * ScalDive — Capacitor configuration.
 *
 * The web deployment keeps its Next.js server; the mobile build is a static
 * export of the demo-mode app (see scripts/build-mobile.mjs), so the native
 * shell only ever needs a folder of files. The shape of this file follows the
 * ScalMart (./project/ecommerce) reference app.
 */
const config: CapacitorConfig = {
  appId: "com.scalmint.flash",
  appName: "ScalDive",
  webDir: "out",
  android: {
    allowMixedContent: false,
    // Remove once the app is stable on-device.
    webContentsDebuggingEnabled: true,
  },
  server: {
    // Capacitor's default WebViewClient hands every navigation to a host that
    // is not the app origin to the system browser (Bridge.launchIntent). ScalDive
    // legitimately navigates to Clerk's frontend API/account portal and to
    // Paystack's hosted checkout, so without this the app jumps to Chrome.
    // `*` keeps every http(s) navigation inside the WebView; non-web schemes
    // (tel:, mailto:) still go to the OS because they have no host to match.
    allowNavigation: ["*"],
  },
};

// Live reload during development: FLASH_CAP_LIVE=<devhost>:3000
if (process.env.FLASH_CAP_LIVE) {
  config.server = config.server ?? {};
  config.server.url = `http://${process.env.FLASH_CAP_LIVE}`;
  config.server.cleartext = true;
} else {
  // ScalDive keeps its server-side rendering, actions and API routes on Vercel,
  // so the shell loads the deployed app instead of a (non-functional) static
  // copy. This keeps payment, live location and push notifications working.
  config.server = config.server ?? {};
  config.server.url = "https://flash.scalmint.com";
}

export default config;
