import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Prototype Radio — Capacitor shell.
 *
 * The web bundle is the app; Capacitor wraps it in a native WebView so the
 * design ships to iOS and Android unchanged. `server.url` is intentionally not
 * set: the bundle is served from the device (capacitor://localhost or
 * https://localhost) exactly as built, and the CMS is reached over HTTPS via
 * VITE_API_URL.
 */
const config: CapacitorConfig = {
  appId: "com.pulseradio.app",
  appName: "Prototype Radio",
  webDir: "dist",
  backgroundColor: "#F6F3EF",
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    backgroundColor: "#F6F3EF",
  },
  android: {
    backgroundColor: "#F6F3EF",
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      // The design's ground is warm off-white, so the status bar glyphs are dark
      // and the bar itself is transparent over the page background.
      style: "DARK",
      backgroundColor: "#F6F3EF",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
