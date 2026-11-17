import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next v16 ships native ESLint flat configs — no FlatCompat shim needed.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/",
      "node_modules/",
      "next-env.d.ts",
      /*
       * apps/mobile is a separate Vite + Capacitor package with its own
       * tsconfig, lockfile and toolchain. Linting it with Next's config reports
       * `next/image` advice for code that never runs on Next, and drags its
       * dependencies into this project's scope. Type-check it there:
       *   npm --prefix apps/mobile run typecheck
       */
      "apps/",
    ],
  },
];

export default eslintConfig;
