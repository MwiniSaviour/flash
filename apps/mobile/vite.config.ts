import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/**
 * The mobile bundle lives inside the radio-waa monorepo. `publicDir` points at
 * the repository's single `public/` folder so the app serves the *same* seeded
 * imagery as the web version instead of keeping a second copy of the assets.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: fileURLToPath(new URL("../../public", import.meta.url)),
  resolve: {
    alias: {
      // App code imports from "~"; "@/…" and "@shared/…" point at the repo's
      // shared src/ so the app consumes the very same seed fixtures the website
      // and the Payload seed script use (one source of truth for content).
      "~": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../../src", import.meta.url)),
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // The Arena preview proxies the dev server under a sandbox host; Vite's
    // host check would otherwise 403 every request from it.
    allowedHosts: true,
    // Payload CMS + the seeded media are served by the Next app. Proxying keeps
    // every request same-origin, so the app works in a sandboxed preview and in
    // a Capacitor WebView without CORS configuration.
    // Only the CMS surfaces are proxied. /assets is deliberately NOT proxied:
    // publicDir already points at the repo's public/ folder, so the dev server
    // must serve those images itself — proxying them made every picture fail
    // whenever the CMS was down (and there is no proxy at all on device).
    proxy: {
      "/api": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/media": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/admin": { target: "http://127.0.0.1:3000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
