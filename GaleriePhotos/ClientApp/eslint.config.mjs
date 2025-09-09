import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";
// import globals from "globals";

export default defineConfig([
    {
        plugins: { js: js, react: reactPlugin, ts: tseslint.plugin },
        languageOptions: {
            ...reactPlugin.configs.flat.recommended.languageOptions,
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                ecmaFeatures: { jsx: true },
            },
            // globals: { ...globals.browser },
        },
        extends: [
            "js/recommended",
            reactPlugin.configs.flat.recommended,
            tseslint.configs.recommended,
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
