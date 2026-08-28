// Regénère le fond de carte de la section « Où Mariane se déplace ».
//   node scripts/contours.mjs
// Les données viennent d'OpenStreetMap (ODbL) et sont figées dans
// src/data/contours.ts : le build reste hors ligne, et la carte ne change que
// le jour où on relance ce script volontairement.
//
// On ne dessine que l'eau. La terre, c'est le fond. Dessiner les terres
// revenait à assembler des frontières administratives, et chacune laissait un
// trou : une MRC oubliée, puis une autre, puis Kahnawake — qui n'appartient à
// aucune MRC.
import { writeFile } from "node:fs/promises";

const AGENT = "mariane-danse-site/1.0 (nicolascarlo.espeon@gmail.com)";

// Liste explicite plutôt qu'une requête par zone. On a essayé de filtrer par
// taille, puis par connexité : aucune règle ne sait distinguer un ruisseau qui
// fait du bruit d'un chenal minuscule qui empêche l'île de se souder à la
// rive. Les deux font une cinquantaine de pixels. Ce qui fait qu'un cours
// d'eau mérite d'être là, c'est qu'il dessine la région — et ça, ça se décide.
//
// Pour retrouver un identifiant devenu invalide : chercher le cours d'eau sur
// openstreetmap.org et lire l'identifiant de la relation dans l'URL.
const EAUX = [
  { osm: "rel/331499", nom: "Lac des Deux-Montagnes" },
  { osm: "rel/1808142", nom: "Lac Saint-Louis" },
  { osm: "rel/1747225", nom: "Rivière des Prairies" },
  { osm: "rel/1764952", nom: "Rivière des Prairies" },
  { osm: "rel/1769788", nom: "Rivière des Prairies (embouchure)" },
  { osm: "rel/1744838", nom: "Rivière des Mille Îles" },
  { osm: "rel/1746332", nom: "Rivière des Mille Îles" },
  { osm: "rel/1273792", nom: "Saint-Laurent (amont)" },
  { osm: "rel/1775822", nom: "Saint-Laurent (aval)" },
  { osm: "rel/1769291", nom: "Saint-Laurent (bassin de La Prairie)" },
  { osm: "rel/6448219", nom: "Saint-Laurent (chenal de Longueuil)" },
  { osm: "rel/16740073", nom: "Rapides de Lachine" },
  { osm: "rel/16740072", nom: "Chenal au sud des rapides" },
  { osm: "way/129896286", nom: "Voie maritime" },
  { osm: "way/128587006", nom: "Voie maritime (section aval)" },
];

// Cadre choisi à la main plutôt que déduit des formes : il tient l'île de
// Montréal entière — c'est elle qu'on reconnaît — et coupe le reste au bord.
const CADRE = {
  longitudeMin: -74.05,
  longitudeMax: -73.42,
  latitudeMin: 45.38,
  latitudeMax: 45.72,
};

const LARGEUR = 800;

// Assez fin pour qu'un chenal étroit survive : c'est en simplifiant à cent
// mètres près qu'on effaçait le passage entre l'île et la Rive-Sud.
const TOLERANCE_DEGRES = 0.0006;

// Overpass est public et gratuit : il renvoie régulièrement 429 ou 504 quand
// il est chargé. Sans reprise, le script échoue une fois sur trois.
const ESSAIS = 5;

const overpass = async (requete) => {
  for (let essai = 1; essai <= ESSAIS; essai += 1) {
    const reponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": AGENT,
      },
      body: `data=${encodeURIComponent(requete)}`,
    });

    if (reponse.ok) return (await reponse.json()).elements;

    if (essai === ESSAIS) {
      throw new Error(
        `Overpass : HTTP ${reponse.status} après ${ESSAIS} essais`,
      );
    }

    const attente = essai * 15;
    console.log(
      `  Overpass ${reponse.status}, nouvel essai dans ${attente} s…`,
    );
    await new Promise((suite) => setTimeout(suite, attente * 1000));
  }
};

const memePoint = ([x1, y1], [x2, y2]) => x1 === x2 && y1 === y2;

// Une relation multipolygone arrive en morceaux de tracé, dans le désordre et
// parfois à l'envers. On les recolle bout à bout.
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

const simplifieUneLigne = (points, tolerance) => {
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
    ...simplifieUneLigne(points.slice(0, indexLePlusLoin + 1), tolerance).slice(
      0,
      -1,
    ),
    ...simplifieUneLigne(points.slice(indexLePlusLoin), tolerance),
  ];
};

// Douglas-Peucker mesure les écarts au segment premier→dernier point. Sur un
// anneau fermé ces deux points sont confondus : le segment est un point, et
// l'algorithme rabote les lobes larges. On coupe donc l'anneau en deux au
// point le plus éloigné du départ avant de simplifier chaque moitié.
const simplifie = (anneau, tolerance) => {
  if (anneau.length <= 3 || !memePoint(anneau[0], anneau.at(-1))) {
    return simplifieUneLigne(anneau, tolerance);
  }

  const depart = anneau[0];
  const ouvert = anneau.slice(0, -1);
  const ecart = ([x, y]) => Math.hypot(x - depart[0], y - depart[1]);
  const oppose = ouvert.reduce(
    (loin, point, index) => (ecart(point) > ecart(ouvert[loin]) ? index : loin),
    0,
  );

  return [
    ...simplifieUneLigne(ouvert.slice(0, oppose + 1), tolerance).slice(0, -1),
    ...simplifieUneLigne([...ouvert.slice(oppose), depart], tolerance),
  ];
};

const surfacesDEau = async () => {
  const selection = (type) =>
    EAUX.filter((eau) => eau.osm.startsWith(`${type}/`))
      .map((eau) => eau.osm.split("/")[1])
      .join(",");

  const elements = await overpass(
    `[out:json][timeout:300];(rel(id:${selection("rel")});` +
      `way(id:${selection("way")}););out geom;`,
  );

  return EAUX.map(({ osm, nom }) => {
    const [type, id] = osm.split("/");
    const element = elements.find(
      (candidat) =>
        String(candidat.id) === id &&
        candidat.type === (type === "rel" ? "relation" : "way"),
    );

    if (!element) {
      throw new Error(
        `${nom} (${osm}) : introuvable dans OpenStreetMap. ` +
          "L'objet a peut-être été redécoupé — chercher son nouvel identifiant.",
      );
    }

    const anneaux = element.members
      ? assembleAnneaux(element.members)
      : [(element.geometry ?? []).map((point) => [point.lon, point.lat])];

    return {
      nom,
      anneaux: anneaux
        .filter((anneau) => anneau.length > 3)
        .map((anneau) => simplifie(anneau, TOLERANCE_DEGRES)),
    };
  });
};

const eaux = await surfacesDEau();

const latitudeCentrale = (CADRE.latitudeMin + CADRE.latitudeMax) / 2;

// À cette latitude un degré de longitude est bien plus court qu'un degré de
// latitude : sans ce facteur, la région paraîtrait étirée d'est en ouest.
const aplatissement = Math.cos((latitudeCentrale * Math.PI) / 180);
const echelle =
  LARGEUR / ((CADRE.longitudeMax - CADRE.longitudeMin) * aplatissement);
const hauteur = Math.round((CADRE.latitudeMax - CADRE.latitudeMin) * echelle);

const projette = ([longitude, latitude]) => [
  (longitude - CADRE.longitudeMin) * aplatissement * echelle,
  (CADRE.latitudeMax - latitude) * echelle,
];

const arrondi = (valeur) => Math.round(valeur * 10) / 10;

// Un anneau entièrement hors du cadre alourdit la page pour un trait que
// personne ne verra.
const DEBORDEMENT = 40;

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

const versTrace = (anneaux) =>
  `${anneaux
    .filter(toucheLeCadre)
    .map((anneau) =>
      anneau
        .map(projette)
        .map(
          ([x, y], index) =>
            `${index === 0 ? "M" : "L"}${arrondi(x)} ${arrondi(y)}`,
        )
        .join(""),
    )
    .join("")}Z`;

const dessinees = eaux.filter(({ anneaux }) => anneaux.some(toucheLeCadre));

const fichier = `// Généré par scripts/contours.mjs — ne pas modifier à la main.
// Contours © les contributeurs d'OpenStreetMap, sous ODbL.
export const carteRegion = {
  largeur: ${LARGEUR},
  hauteur: ${hauteur},
  // De quoi placer un point de latitude/longitude dans le même repère
  projection: {
    longitudeMin: ${CADRE.longitudeMin},
    latitudeMax: ${CADRE.latitudeMax},
    aplatissement: ${aplatissement},
    echelle: ${echelle},
  },
  // Tout ce qui n'est pas dans cette liste est de la terre.
  eaux: [
${dessinees
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
console.log(
  `src/data/contours.ts écrit — ${LARGEUR}×${hauteur}, ${poids} Ko, ` +
    `${dessinees.length} plans d'eau sur ${EAUX.length}`,
);
