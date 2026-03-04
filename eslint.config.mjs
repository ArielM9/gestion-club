import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = {
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/no-unescaped-ities": "off",
  },
};

export default eslintConfig;
