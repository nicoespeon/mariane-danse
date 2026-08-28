import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import prettier from "eslint-config-prettier/flat";

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      ".claude/worktrees/**",
      ".lighthouseci/**",
      "node_modules/**",
      // Regénéré par scripts/contours.mjs
      "src/data/contours.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  {
    files: ["**/*.{js,mjs,ts,astro}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Un agent qui laisse une variable derrière lui doit le voir tout de
      // suite ; le préfixe « _ » reste la porte de sortie explicite.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  {
    // Les scripts d'outillage parlent au terminal, c'est leur métier
    files: ["scripts/**"],
    rules: { "no-console": "off" },
  },

  // En dernier : neutralise les règles de style qui doublonnent Prettier
  prettier,
];
