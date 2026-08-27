// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// TODO: remplacer par le domaine définitif une fois réservé (cf. tâche Notion)
export const SITE_URL = "https://marianedanse.ca";

export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  image: {
    // Toutes les <Image /> sont responsives par défaut : srcset et dimensions
    // calculés au build, sans avoir à y penser à chaque appel.
    layout: "constrained",
  },
  build: {
    inlineStylesheets: "always",
  },
});
