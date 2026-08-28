// Regénère les contours de la carte des territoires desservis.
//   node scripts/contours.mjs
// Les données viennent d'OpenStreetMap (ODbL) et sont figées dans
// src/data/contours.ts : le build reste hors ligne, et la carte ne change
// que le jour où on relance ce script volontairement.
import { writeFile } from "node:fs/promises";

const AGENT = "mariane-danse-site/1.0 (nicolascarlo.espeon@gmail.com)";

// Les frontières administratives englobent l'eau : dessinées telles quelles,
// les rivières disparaissent et les îles ne se lisent plus. On prend donc les
// vraies îles (place=island) et, pour la Rive-Nord, les MRC — leur limite sud
// s'arrête au milieu de la rivière, ce qui laisse voir le cours d'eau.
// L'ordre est celui du tracé : la terre ferme d'abord, les îles par-dessus.
const TERRITOIRES = [
  {
    nom: "Rive-Nord",
    requete: "Thérèse-De Blainville, Québec",
    desservi: true,
  },
  {
    nom: "Deux-Montagnes",
    requete: "Deux-Montagnes (MRC), Québec, Canada",
    desservi: true,
  },
  { nom: "Laval", requete: "Île Jésus, Laval", desservi: true },
  { nom: "Montréal", requete: "Île de Montréal", desservi: true },
  { nom: "Île Bizard", requete: "Île Bizard", desservi: true },
];

const LARGEUR = 800;
// Un peu d'eau tout autour : sans marge, l'île de Montréal touche le bord.
const MARGE = 24;
// Sous ce seuil, un point n'apporte plus rien à la silhouette : à cette
// échelle, un dixième de millième de degré vaut à peu près un pixel.
const TOLERANCE_DEGRES = 0.0007;

const cherche = async (requete) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", requete);
  url.searchParams.set("format", "json");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("limit", "1");

  const reponse = await fetch(url, { headers: { "User-Agent": AGENT } });
  if (!reponse.ok) throw new Error(`${requete} : HTTP ${reponse.status}`);

  const [resultat] = await reponse.json();
  if (!resultat?.geojson) throw new Error(`${requete} : aucun contour`);
  return resultat.geojson;
};

// On ne garde que les anneaux extérieurs : les trous (lacs, enclaves) sont
// invisibles à cette taille et doubleraient le poids du fichier.
const anneauxExterieurs = (geojson) =>
  geojson.type === "MultiPolygon"
    ? geojson.coordinates.map((polygone) => polygone[0])
    : [geojson.coordinates[0]];

const distanceAuSegment = ([x, y], [xa, ya], [xb, yb]) => {
  const dx = xb - xa;
  const dy = yb - ya;
  const longueur = dx * dx + dy * dy;
  const t =
    longueur === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - xa) * dx + (y - ya) * dy) / longueur));
  return Math.hypot(x - (xa + t * dx), y - (ya + t * dy));
};

const simplifie = (points, tolerance) => {
  if (points.length < 3) return points;

  let indexLePlusLoin = 0;
  let distanceMax = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distanceAuSegment(
      points[i],
      points[0],
      points[points.length - 1],
    );
    if (distance > distanceMax) {
      distanceMax = distance;
      indexLePlusLoin = i;
    }
  }

  if (distanceMax <= tolerance) return [points[0], points[points.length - 1]];

  return [
    ...simplifie(points.slice(0, indexLePlusLoin + 1), tolerance).slice(0, -1),
    ...simplifie(points.slice(indexLePlusLoin), tolerance),
  ];
};

const contours = await Promise.all(
  TERRITOIRES.map(async (territoire, rang) => {
    // Nominatim demande une requête par seconde, pas davantage.
    await new Promise((suite) => setTimeout(suite, rang * 1200));
    const geojson = await cherche(territoire.requete);
    return {
      ...territoire,
      anneaux: anneauxExterieurs(geojson).map((anneau) =>
        simplifie(anneau, TOLERANCE_DEGRES),
      ),
    };
  }),
);

const tousLesPoints = contours.flatMap(({ anneaux }) => anneaux.flat());
const longitudes = tousLesPoints.map(([longitude]) => longitude);
const latitudes = tousLesPoints.map(([, latitude]) => latitude);

const cadre = {
  longitudeMin: Math.min(...longitudes),
  longitudeMax: Math.max(...longitudes),
  latitudeMin: Math.min(...latitudes),
  latitudeMax: Math.max(...latitudes),
};
const latitudeCentrale = (cadre.latitudeMin + cadre.latitudeMax) / 2;

// À cette latitude un degré de longitude est bien plus court qu'un degré de
// latitude : sans ce facteur, la région paraîtrait étirée d'est en ouest.
const aplatissement = Math.cos((latitudeCentrale * Math.PI) / 180);
const echelle =
  (LARGEUR - 2 * MARGE) /
  ((cadre.longitudeMax - cadre.longitudeMin) * aplatissement);
const hauteur = Math.round(
  (cadre.latitudeMax - cadre.latitudeMin) * echelle + 2 * MARGE,
);

const projette = ([longitude, latitude]) => [
  MARGE + (longitude - cadre.longitudeMin) * aplatissement * echelle,
  MARGE + (cadre.latitudeMax - latitude) * echelle,
];

const arrondi = (valeur) => Math.round(valeur * 10) / 10;

const versTrace = (anneaux) =>
  anneaux
    .map((anneau) =>
      anneau
        .map(projette)
        .map(
          ([x, y], index) =>
            `${index === 0 ? "M" : "L"}${arrondi(x)} ${arrondi(y)}`,
        )
        .join(""),
    )
    .join("") + "Z";

const fichier = `// Généré par scripts/contours.mjs — ne pas modifier à la main.
// Contours administratifs © les contributeurs d'OpenStreetMap, sous ODbL.
export const carteRegion = {
  largeur: ${LARGEUR},
  hauteur: ${hauteur},
  // De quoi placer un point de latitude/longitude dans le même repère
  projection: {
    longitudeMin: ${cadre.longitudeMin},
    latitudeMax: ${cadre.latitudeMax},
    aplatissement: ${aplatissement},
    echelle: ${echelle},
    marge: ${MARGE},
  },
  territoires: [
${contours
  .map(
    ({ nom, desservi, anneaux }) =>
      `    {\n      nom: ${JSON.stringify(nom)},\n      desservi: ${desservi},\n      trace:\n        ${JSON.stringify(versTrace(anneaux))},\n    },`,
  )
  .join("\n")}
  ],
} as const;
`;

await writeFile(new URL("../src/data/contours.ts", import.meta.url), fichier);

const poids = Math.round(Buffer.byteLength(fichier) / 1024);
console.log(`src/data/contours.ts écrit — ${LARGEUR}×${hauteur}, ${poids} Ko`);
