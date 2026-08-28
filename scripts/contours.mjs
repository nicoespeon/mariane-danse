// Regénère le fond de carte de la section « Où Mariane se déplace ».
//   node scripts/contours.mjs
// Les données viennent d'OpenStreetMap (ODbL) et sont figées dans
// src/data/contours.ts : le build reste hors ligne, et la carte ne change
// que le jour où on relance ce script volontairement.
//
// On ne dessine que l'eau. La terre, c'est le fond de la carte. Dessiner les
// terres revenait à assembler des frontières administratives, et chacune
// laissait un trou : une MRC oubliée, puis une autre, puis Kahnawake — qui
// n'appartient à aucune MRC. L'eau, elle, se suffit : ce qui n'est pas une
// rivière ou un lac est de la terre, sans exception à tenir à jour.
import { writeFile } from "node:fs/promises";

const AGENT = "mariane-danse-site/1.0 (nicolascarlo.espeon@gmail.com)";

// Le fleuve n'a pas de relation nommée : dans OpenStreetMap, le Saint-Laurent
// autour de Montréal est un assemblage de surfaces `water=river` anonymes.
// Nominatim ne les indexe donc pas, et on passe par Overpass.
const CADRE_DES_EAUX = "45.35,-74.10,45.80,-73.35";

// Les deux lacs sont nommés, donc Nominatim les connaît.
const EAUX = [
  { nom: "Lac des Deux Montagnes", requete: "Lac des Deux Montagnes, Québec" },
  { nom: "Lac Saint-Louis", requete: "Lac Saint-Louis, Québec" },
];

// Cadre choisi à la main plutôt que déduit des formes : il tient l'île de
// Montréal entière — c'est elle qu'on reconnaît — et coupe le reste au bord.
const CADRE = {
  longitudeMin: -74.05,
  longitudeMax: -73.42,
  latitudeMin: 45.38,
  latitudeMax: 45.72,
};

const overpass = async (requete) => {
  const reponse = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": AGENT,
    },
    body: `data=${encodeURIComponent(requete)}`,
  });
  if (!reponse.ok) throw new Error(`Overpass : HTTP ${reponse.status}`);
  return (await reponse.json()).elements;
};

const memePoint = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;

// Une relation multipolygone d'OpenStreetMap arrive en morceaux de tracé, dans
// le désordre et parfois à l'envers. On les recolle bout à bout.
const assembleAnneaux = (membres) => {
  const morceaux = membres
    .filter((membre) => membre.role === "outer" && membre.geometry)
    .map((membre) => membre.geometry.map((point) => [point.lon, point.lat]));

  const anneaux = [];
  let anneau = morceaux.shift();

  while (anneau) {
    const depart = anneau[0];
    const arrivee = anneau.at(-1);

    if (memePoint(depart, arrivee)) {
      anneaux.push(anneau);
      anneau = morceaux.shift();
      continue;
    }

    const suivant = morceaux.findIndex(
      (morceau) =>
        memePoint(morceau[0], arrivee) || memePoint(morceau.at(-1), arrivee),
    );

    if (suivant === -1) {
      // Rien ne se raccorde : on ferme et on passe au suivant.
      anneaux.push([...anneau, depart]);
      anneau = morceaux.shift();
      continue;
    }

    const [morceau] = morceaux.splice(suivant, 1);
    anneau = memePoint(morceau[0], arrivee)
      ? [...anneau, ...morceau.slice(1)]
      : [...anneau, ...morceau.reverse().slice(1)];
  }

  return anneaux;
};

const surfacesDEau = async () => {
  // Deux temps : la boîte englobante donne les identifiants, puis on
  // redemande les relations entières. Sans ça, Overpass rogne la géométrie
  // au bord du cadre et les anneaux ne se referment plus.
  const trouvees = await overpass(
    `[out:json][timeout:180];rel["water"="river"](${CADRE_DES_EAUX});out ids;`,
  );
  const identifiants = trouvees.map((element) => element.id);
  if (identifiants.length === 0) throw new Error("Aucune surface d'eau");

  const relations = await overpass(
    `[out:json][timeout:300];rel(id:${identifiants.join(",")});out geom;`,
  );

  return relations.map((relation) => ({
    nom: relation.tags?.name ?? `Cours d'eau ${relation.id}`,
    anneaux: assembleAnneaux(relation.members ?? []).map((anneau) =>
      simplifie(anneau, TOLERANCE_DEGRES),
    ),
  }));
};

const LARGEUR = 800;

// Sous ce seuil, un point n'apporte plus rien à la silhouette. Volontairement
// grossier : c'est le détail des côtes qui rendait la carte bruyante.
const TOLERANCE_DEGRES = 0.0012;

const EST_UNE_SURFACE = new Set(["Polygon", "MultiPolygon"]);

const cherche = async (requete, classesAcceptees) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", requete);
  url.searchParams.set("format", "json");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("limit", "5");

  const reponse = await fetch(url, { headers: { "User-Agent": AGENT } });
  if (!reponse.ok) throw new Error(`${requete} : HTTP ${reponse.status}`);

  const resultats = await reponse.json();
  const retenu = resultats.find(
    (resultat) =>
      classesAcceptees.has(resultat.class) &&
      EST_UNE_SURFACE.has(resultat.geojson?.type),
  );

  if (!retenu) {
    const vus = resultats
      .map((resultat) => `${resultat.class}=${resultat.type}`)
      .join(", ");
    throw new Error(`${requete} : aucune surface exploitable (vu : ${vus})`);
  }

  return retenu.geojson;
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

const eaux = await Promise.all(
  EAUX.map(async (plan, rang) => {
    await new Promise((suite) => setTimeout(suite, rang * 1200));
    const geojson = await cherche(
      plan.requete,
      new Set(["natural", "water", "waterway"]),
    );
    return {
      nom: plan.nom,
      // Un lac n'a aucun détail utile à cette échelle, et celui des Deux
      // Montagnes arrive avec vingt mille points.
      anneaux: anneauxExterieurs(geojson).map((anneau) =>
        simplifie(anneau, TOLERANCE_DEGRES),
      ),
    };
  }),
);

const cours = (await surfacesDEau()).filter(
  ({ anneaux }) => anneaux.reduce((n, a) => n + a.length, 0) >= 8,
);
eaux.push(...cours);

const POINTS_MINIMUM = 8;

for (const { nom, anneaux } of eaux) {
  const points = anneaux.reduce((total, anneau) => total + anneau.length, 0);
  if (points < POINTS_MINIMUM) {
    throw new Error(
      `${nom} : ${points} points après simplification, c'est un artefact — ` +
        "vérifier ce que la requête ramène.",
    );
  }
}

const cadre = CADRE;
const latitudeCentrale = (cadre.latitudeMin + cadre.latitudeMax) / 2;

// À cette latitude un degré de longitude est bien plus court qu'un degré de
// latitude : sans ce facteur, la région paraîtrait étirée d'est en ouest.
const aplatissement = Math.cos((latitudeCentrale * Math.PI) / 180);
const echelle =
  LARGEUR / ((cadre.longitudeMax - cadre.longitudeMin) * aplatissement);
const hauteur = Math.round((cadre.latitudeMax - cadre.latitudeMin) * echelle);

const projette = ([longitude, latitude]) => [
  (longitude - cadre.longitudeMin) * aplatissement * echelle,
  (cadre.latitudeMax - latitude) * echelle,
];

const arrondi = (valeur) => Math.round(valeur * 10) / 10;

// Beaucoup de ruisseaux ramenés par la requête tombent entièrement hors du
// cadre : les garder, c'est alourdir la page pour des traits invisibles.
const DEBORDEMENT = 40;

// Un ruisseau de quelques dizaines de pixels au milieu des terres ne se lit
// pas comme de l'eau : il se lit comme une rayure sur la carte.
const SURFACE_MINIMALE = 5000;

const assezGrand = (anneau) => {
  const points = anneau.map(projette);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const largeur = Math.max(...xs) - Math.min(...xs);
  const hauteur_ = Math.max(...ys) - Math.min(...ys);
  return largeur * hauteur_ >= SURFACE_MINIMALE;
};

const toucheLeCadre = (anneau) => {
  const points = anneau.map(projette);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return (
    Math.max(...xs) > -DEBORDEMENT &&
    Math.min(...xs) < LARGEUR + DEBORDEMENT &&
    Math.max(...ys) > -DEBORDEMENT &&
    Math.min(...ys) < hauteur + DEBORDEMENT
  );
};

const retenu = (anneau) => toucheLeCadre(anneau) && assezGrand(anneau);

const versTrace = (anneaux) =>
  anneaux
    .filter(retenu)
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
  },
  // Tout ce qui n'est pas dans cette liste est de la terre.
  eaux: [
${eaux
  .filter(({ anneaux }) => anneaux.some(retenu))
  .map(
    ({ nom, anneaux }) =>
      `    {\n      nom: ${JSON.stringify(nom)},\n      trace:\n        ${JSON.stringify(versTrace(anneaux))},\n    },`,
  )
  .join("\n")}
  ],
} as const;
`;

await writeFile(new URL("../src/data/contours.ts", import.meta.url), fichier);

const poids = Math.round(Buffer.byteLength(fichier) / 1024);
console.log(`src/data/contours.ts écrit — ${LARGEUR}×${hauteur}, ${poids} Ko`);
