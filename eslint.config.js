import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "tests/**",
      "**/*.test.ts",
      "*.config.ts",
      "eslint.config.js",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      // CDEK API responses are typed via `as` assertions from `unknown`; that's intentional.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
