// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// mariannedanse.ca (deux n) est réservé aussi, en redirection vers celui-ci :
// « Mariane » s'écrit spontanément avec deux n.
export const SITE_URL = "https://marianedanse.ca";

export default defineConfig({
  site: SITE_URL,
  integrations: [
    // /merci n'existe que pour l'instant qui suit un envoi : hors de l'index,
    // hors du plan du site.
    sitemap({ filter: (page) => !page.endsWith("/merci/") }),
  ],
  image: {
    // Toutes les <Image /> sont responsives par défaut : srcset et dimensions
    // calculés au build, sans avoir à y penser à chaque appel.
    layout: "constrained",
  },
  build: {
    inlineStylesheets: "always",
  },
});
