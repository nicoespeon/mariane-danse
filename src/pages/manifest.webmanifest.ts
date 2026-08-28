import type { APIRoute } from "astro";
import { site } from "../data/site";

// Généré plutôt que figé dans public/ : le nom y était resté « Mariane Rollot
// Carlo » après le changement d'ordre, et rien ne pouvait le signaler.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: `${site.nom} — Zumba`,
        short_name: site.nom.split(" ")[0],
        description: `${site.accroche}.`,
        lang: "fr-CA",
        start_url: "/",
        display: "standalone",
        background_color: "#fff8f0",
        theme_color: "#0b5c64",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      null,
      2,
    ),
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } },
  );
