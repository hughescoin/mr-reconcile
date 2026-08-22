import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".vercel/**",
    "next-env.d.ts",
    // Generated eve compiler and host output.
    ".eve/**",
    ".output/**",
    ".nitro/**",
    // Static design-handoff references are not application source.
    "docs/design_handoff_mr_reconcile/**",
  ]),
]);

export default eslintConfig;
