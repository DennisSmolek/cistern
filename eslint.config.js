import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["dist", "node_modules"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
        },
        rules: {
            "no-unused-vars": "warn",
            "prefer-const": "error",
        },
    },
];
