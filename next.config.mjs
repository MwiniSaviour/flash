/**
 * Flash — Next.js configuration.
 *
 * The app is a mobile-first web client for three services (event tickets, rides
 * and food) with a desktop layout that follows the social-app idiom: a left
 * navigation rail, a central content column and a right-hand rail.
 *
 * Images are local files under public/assets/images, so no remote host needs to
 * be allowed. Image optimisation follows Vercel: on, where a native sharp
 * prebuild exists; off where only the WASM build is available.
 */
const isVercel = Boolean(process.env.VERCEL);

const imageOptimization = process.env.NEXT_IMAGE_OPTIMIZATION
  ? process.env.NEXT_IMAGE_OPTIMIZATION === "on"
  : isVercel;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Flash books rides and food; it never records the user or their payment.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,

  allowedDevOrigins: [
    "*.e2b.app",
    "*.arena.ai",
    "*.usercontent.goog",
    "localhost",
    "127.0.0.1",
  ],

  images: {
    unoptimized: !imageOptimization,
    formats: ["image/avif", "image/webp"],
    // Cloudinary already delivers f_auto/q_auto, so these are only for the
    // cases where a component opts into next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  typescript: { ignoreBuildErrors: false },

  experimental: isVercel
    ? {}
    : {
        // Small-memory hosts: cap the static-generation worker pool.
        cpus: 2,
        staticGenerationMaxConcurrency: 2,
      },

  async rewrites() {
    const adminHost = (process.env.ADMIN_HOST ?? "admin.flash.scalmint.com").replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    return [
      {
        source: "/",
        destination: "/admin",
        has: [{ type: "host", value: adminHost }],
      },
    ];
  },

  async headers() {
    const headers = [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/assets/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];

    if (process.env.VERCEL_ENV === "preview") {
      headers.push({
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      });
    }

    return headers;
  },
};

export default nextConfig;
