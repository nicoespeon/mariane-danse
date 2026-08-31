import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import * as z from "zod";

// Tout tient dans le frontmatter : le corps du Markdown n'est rendu nulle part,
// et la page unique n'a pas d'endroit où le mettre. Quatre fiches en portaient
// un, jamais affiché, qui a fini par décrire les offres autrement que le
// frontmatter. Ne pas en réécrire.
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
    // Un organisme se présente par une fonction, un avis ZIN par le lien qui
    // permet de le vérifier. Ni l'un ni l'autre ne peut emprunter les champs
    // de son voisin.
    source: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("organisme"),
        fonction: z.string(),
        organisme: z.string(),
      }),
      z.object({ type: z.literal("avis-zin") }),
    ]),
    // Tant que le témoignage n'est pas confirmé, il ne sort pas du build
    publie: z.boolean().default(false),
  }),
});

export const collections = { offres, temoignages };
