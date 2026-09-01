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
        // Android habille d'un cercle blanc toute icône qui n'est pas
        // déclarée « maskable », d'où le carré rétréci au milieu d'une pastille.
        // La version maskable remplit le carré et garde son contenu dans les
        // 80 % centraux, la zone que le système ne rogne jamais.
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icone-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      null,
      2,
    ),
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } },
  );
