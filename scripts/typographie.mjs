// La typographie québécoise diffère de la française sur un point que tout le
// monde se fait avoir : pas d'espace devant « ? », « ! » et « ; ». Une règle
// écrite dans AGENTS.md se perd ; ce script, lui, fait échouer le build.
// On lit le HTML produit plutôt que les sources : ce que le visiteur lit.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ESPACES = "[ \\u00a0\\u202f\\u2009]";

const fautes = [
  {
    motif: new RegExp(`\\S${ESPACES}([?!;])`, "gu"),
    explique: (signe) => `espace avant « ${signe} » (au Québec, on colle)`,
  },
  {
    motif: new RegExp(`\\S ([:%])`, "gu"),
    explique: (signe) =>
      `espace ordinaire avant « ${signe} » (il faut une insécable)`,
  },
  {
    motif: /« | »/gu,
    explique: () =>
      "espace ordinaire dans des guillemets (il faut une insécable)",
  },
];

const fichiersHtml = async (dossier) => {
  const entrees = await readdir(dossier, { withFileTypes: true });
  const chemins = await Promise.all(
    entrees.map((entree) => {
      const chemin = join(dossier, entree.name);
      if (entree.isDirectory()) return fichiersHtml(chemin);
      return entree.name.endsWith(".html") ? [chemin] : [];
    }),
  );
  return chemins.flat();
};

// Le CSS et le JavaScript embarqués sont pleins de « ; » : ils ne sont pas du
// texte, ils sortent avant l'analyse.
const texteVisible = (html) =>
  html
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/gu, " ")
    .replace(/&#160;/gu, " ");

const dist = new URL("../dist/", import.meta.url).pathname;
const releves = [];

for (const fichier of await fichiersHtml(dist)) {
  const texte = texteVisible(await readFile(fichier, "utf8"));

  for (const { motif, explique } of fautes) {
    for (const trouvaille of texte.matchAll(motif)) {
      const signe = trouvaille[1] ?? trouvaille[0].trim();
      const contexte = texte
        .slice(Math.max(0, trouvaille.index - 40), trouvaille.index + 20)
        .replace(/\s+/gu, " ")
        .trim();
      releves.push(
        `${fichier.replace(dist, "")} — ${explique(signe)}\n    …${contexte}…`,
      );
    }
  }
}

if (releves.length > 0) {
  console.error("Typographie québécoise :\n");
  releves.forEach((releve) => console.error(`  ${releve}\n`));
  console.error(
    "Règles complètes dans AGENTS.md, section « Français du Québec ».",
  );
  process.exit(1);
}

console.log("Typographie québécoise : rien à signaler.");
