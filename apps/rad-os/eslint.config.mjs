import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noopRule = {
  meta: {},
  create() {
    return {};
  },
};

const rdnaCompatibilityPlugin = {
  meta: { name: "compat-rdna-design-rules" },
  rules: {
    "no-hardcoded-colors": noopRule,
    "no-hardcoded-typography": noopRule,
    "no-raw-line-height": noopRule,
    "no-raw-radius": noopRule,
    "no-raw-shadow": noopRule,
    "prefer-rdna-components": noopRule,
  },
};

const eslintConfig = defineConfig([
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    plugins: {
      rdna: rdnaCompatibilityPlugin,
    },
  },
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored canvas engine (has @ts-nocheck, references rules not loaded here)
    "lib/dotting/**",
  ]),
]);

export default eslintConfig;
