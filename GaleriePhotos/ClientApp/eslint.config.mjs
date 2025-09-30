import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      js: js,
      react: reactPlugin,
      ts: tseslint.plugin,
      reactHooks: reactHooks,
    },
    languageOptions: {
      ...reactPlugin.configs.flat.recommended.languageOptions,
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
      },
    },
    extends: [
      "js/recommended",
      reactPlugin.configs.flat.recommended,
      tseslint.configs.recommended,
      "reactHooks/recommended-latest",
    ],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);
