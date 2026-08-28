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
  // Astro mange l'espace entre une expression et l'élément qui suit. Le
  // résultat — « Zumba Gold®.Vérifiable » — ne se voit qu'à la relecture.
  {
    motif: /[.!?…]\p{Lu}/gu,
    explique: (collision) =>
      `ponctuation collée au mot suivant : « ${collision} »`,
  },
  {
    // mailto: et https: sont les seuls deux-points légitimement collés
    motif: /(?<!https?|mailto|tel)[,;:]\p{L}/gu,
    explique: (collision) =>
      `ponctuation collée au mot suivant : « ${collision} »`,
  },
];

// Ces deux-là se lisent sur le HTML brut, pas sur le texte : une fois les
// balises retirées, « à<a>courriel » et « à courriel » se ressemblent trop.
// Même cause que les fautes ci-dessus — Astro mange l'espace devant un
// élément — mais sans ponctuation pour la trahir.
const collisionsDeBalises = [
  {
    motif: /\p{L}<a\b[^>]*>\p{L}/gu,
    explique: () => 'mot collé au lien qui suit (mettre un {" "} avant)',
  },
  {
    motif: /<\/a>\p{L}/gu,
    explique: () => 'lien collé au mot qui suit (mettre un {" "} après)',
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
// texte, ils sortent avant l'analyse. Les entités, elles, doivent être
// décodées : sans ça, chaque « d&#39;une » ressemble à une faute.
const ENTITES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  laquo: "«",
  raquo: "»",
  hellip: "…",
};

const decode = (texte) =>
  texte.replace(/&(#\d+|#x[\da-f]+|\w+);/giu, (entier, corps) => {
    if (corps.startsWith("#x") || corps.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(corps.slice(2), 16));
    if (corps.startsWith("#"))
      return String.fromCodePoint(Number.parseInt(corps.slice(1), 10));
    return ENTITES[corps.toLowerCase()] ?? entier;
  });

// Une balise en ligne disparaît sans laisser d'espace, un bloc en laisse une.
// C'est toute la différence entre « Gold®.<a>Voir » — la faute qu'on cherche —
// et « …groupe.</p><p>Le plus rapide », qui est correct.
const EN_LIGNE =
  /^<\/?(a|abbr|b|code|em|i|mark|s|small|span|strong|sub|sup|time|u)\b/iu;

const sansCodeEmbarque = (html) =>
  html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gu, " ");

const texteVisible = (html) =>
  decode(
    sansCodeEmbarque(html).replace(/<[^>]+>/gu, (balise) =>
      EN_LIGNE.test(balise) ? "" : " ",
    ),
  );

const dist = new URL("../dist/", import.meta.url).pathname;
const releves = [];

const contexte = (source, index) =>
  source
    .slice(Math.max(0, index - 40), index + 25)
    .replace(/\s+/gu, " ")
    .trim();

for (const fichier of await fichiersHtml(dist)) {
  const html = await readFile(fichier, "utf8");
  const balisage = sansCodeEmbarque(html);
  const texte = texteVisible(html);

  for (const { motif, explique } of collisionsDeBalises) {
    for (const trouvaille of balisage.matchAll(motif)) {
      releves.push(
        `${fichier.replace(dist, "")} — ${explique()}\n    …${contexte(balisage, trouvaille.index)}…`,
      );
    }
  }

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
