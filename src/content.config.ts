import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import * as z from "zod";

const offres = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/offres" }),
  schema: z.object({
    titre: z.string(),
    pour: z.string(),
    // Ne s'affiche pas sur la carte, sert de description dans le JSON-LD
    resume: z.string(),
    // Trois, pas quatre : au-delà, la carte devient un mur de texte
    bienfaits: z.array(z.string()).min(2).max(3),
    ordre: z.number(),
    emoji: z.string(),
  }),
});

const temoignages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/temoignages" }),
  schema: z.object({
    citation: z.string(),
    auteur: z.string(),
    fonction: z.string(),
    organisme: z.string(),
    // Tant que le témoignage n'est pas confirmé, il ne sort pas du build
    publie: z.boolean().default(false),
  }),
});

export const collections = { offres, temoignages };
