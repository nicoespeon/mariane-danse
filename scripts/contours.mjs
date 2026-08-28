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

// Cadre choisi à la main plutôt que déduit des formes : il tient l'île de
// Montréal entière — c'est elle qu'on reconnaît — et coupe le reste au bord.
const CADRE = {
  longitudeMin: -74.05,
  longitudeMax: -73.42,
  latitudeMin: 45.38,
  latitudeMax: 45.72,
};

const ESSAIS = 4;

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

// Toute l'eau n'est pas en relations : la voie maritime, qui sépare l'île de
// Montréal de la Rive-Sud, est une simple `way`. Et tout le monde ne met pas
// `natural=water` — certains ne posent que `water=*`.
const FILTRES = ['["natural"="water"]', '["water"]'];

// Il y a plus de mille `way` d'eau dans le cadre, dont des mares de parc. On
// demande d'abord leurs boîtes englobantes, qui sont légères, et on ne
// réclame la géométrie que de celles qui pèsent quelque chose.
const AIRE_MINIMALE_DEGRES = 0.0001;

const aireDeLaBoite = (element) =>
  element.bounds
    ? (element.bounds.maxlat - element.bounds.minlat) *
      (element.bounds.maxlon - element.bounds.minlon)
    : 0;

const surfacesDEau = async () => {
  const requete = (type, sortie) =>
    `[out:json][timeout:180];(${FILTRES.map(
      (filtre) => `${type}${filtre}(${CADRE_DES_EAUX});`,
    ).join("")});out ${sortie};`;

  const [relations, chemins] = await Promise.all([
    overpass(requete("rel", "ids")),
    overpass(requete("way", "ids bb")),
  ]);

  const cheminsRetenus = chemins.filter(
    (chemin) => aireDeLaBoite(chemin) >= AIRE_MINIMALE_DEGRES,
  );

  console.log(
    `  ${relations.length} relations, ${cheminsRetenus.length} chemins retenus` +
      ` sur ${chemins.length}`,
  );

  const identifiants = (elements) =>
    [...new Set(elements.map((element) => element.id))].join(",");

  const entiers = await overpass(
    `[out:json][timeout:300];(rel(id:${identifiants(relations)});` +
      `way(id:${identifiants(cheminsRetenus)}););out geom;`,
  );

  return entiers.map((element) => ({
    nom: element.tags?.name ?? `${element.type} ${element.id}`,
    // Une `way` est déjà un anneau ; une relation arrive en morceaux.
    anneaux: (element.members
      ? assembleAnneaux(element.members)
      : [(element.geometry ?? []).map((point) => [point.lon, point.lat])]
    )
      .filter((anneau) => anneau.length > 3)
      .map((anneau) => simplifie(anneau, TOLERANCE_DEGRES)),
  }));
};

const LARGEUR = 800;

// Sous ce seuil, un point n'apporte plus rien à la silhouette. Volontairement
// grossier : c'est le détail des côtes qui rendait la carte bruyante.
const TOLERANCE_DEGRES = 0.0012;

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

// Douglas-Peucker mesure les écarts par rapport au segment premier→dernier
// point. Sur un anneau fermé ces deux points sont confondus : le segment est
// un point, et l'algorithme rabote les lobes larges — le bassin au sud de
// l'île de Montréal disparaissait, ce qui soudait l'île à la Rive-Sud. On
// coupe donc l'anneau en deux au point le plus éloigné du départ, on simplifie
// chaque moitié, puis on recolle.
const simplifieUnAnneau = (anneau, tolerance) => {
  const depart = anneau[0];
  const ouvert = anneau.slice(0, -1);

  const distanceAuDepart = ([x, y]) => Math.hypot(x - depart[0], y - depart[1]);
  const oppose = ouvert.reduce(
    (loin, point, index) =>
      distanceAuDepart(point) > distanceAuDepart(ouvert[loin]) ? index : loin,
    0,
  );

  const aller = simplifieUneLigne(ouvert.slice(0, oppose + 1), tolerance);
  const retour = simplifieUneLigne(
    [...ouvert.slice(oppose), depart],
    tolerance,
  );

  return [...aller.slice(0, -1), ...retour];
};

const estFerme = (anneau) =>
  anneau.length > 3 && memePoint(anneau[0], anneau.at(-1));

const simplifie = (points, tolerance) =>
  estFerme(points)
    ? simplifieUnAnneau(points, tolerance)
    : simplifieUneLigne(points, tolerance);

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

const eaux = (await surfacesDEau()).filter(
  ({ anneaux }) => anneaux.reduce((n, a) => n + a.length, 0) >= 8,
);

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

// Ce qui fait qu'un cours d'eau mérite d'être dessiné n'est pas sa taille,
// c'est qu'il touche le reste de l'eau. Une rayure isolée au milieu des terres
// ne se lit pas comme de l'eau, alors qu'un fragment minuscule à l'embouchure
// de la rivière des Prairies, lui, est ce qui empêche l'île de se souder à la
// Rive-Nord. Aucun seuil de taille ne sait faire la différence : les deux font
// une cinquantaine de pixels.
const DISTANCE_DE_JONCTION = 25;

const boite = (anneau) => {
  const xs = anneau.map(([x]) => x);
  const ys = anneau.map(([, y]) => y);
  return {
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(...ys),
    yMax: Math.max(...ys),
  };
};

const boitesProches = (une, autre, marge) =>
  une.xMin - marge <= autre.xMax &&
  autre.xMin - marge <= une.xMax &&
  une.yMin - marge <= autre.yMax &&
  autre.yMin - marge <= une.yMax;

const seTouchent = (une, autre) => {
  if (!boitesProches(boite(une), boite(autre), DISTANCE_DE_JONCTION)) {
    return false;
  }

  return une.some(([x1, y1]) =>
    autre.some(
      ([x2, y2]) => Math.hypot(x1 - x2, y1 - y2) <= DISTANCE_DE_JONCTION,
    ),
  );
};

// On part du plus grand plan d'eau et on garde tout ce qui s'y raccroche, de
// proche en proche.
const reliesAuReseau = (anneaux) => {
  const aire = (anneau) => {
    const { xMin, xMax, yMin, yMax } = boite(anneau);
    return (xMax - xMin) * (yMax - yMin);
  };

  const depart = anneaux.reduce(
    (plusGrand, anneau) =>
      aire(anneau) > aire(plusGrand) ? anneau : plusGrand,
    anneaux[0],
  );

  const reseau = new Set([depart]);
  let aExplorer = [depart];

  while (aExplorer.length > 0) {
    const courant = aExplorer.pop();
    const voisins = anneaux.filter(
      (anneau) => !reseau.has(anneau) && seTouchent(courant, anneau),
    );
    voisins.forEach((voisin) => reseau.add(voisin));
    aExplorer = [...aExplorer, ...voisins];
  }

  return reseau;
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

let reseau = new Set();

const retenu = (anneau) => toucheLeCadre(anneau) && reseau.has(anneau);

reseau = reliesAuReseau(
  eaux.flatMap(({ anneaux }) => anneaux.filter(toucheLeCadre)),
);

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
console.log(
  `src/data/contours.ts écrit — ${LARGEUR}×${hauteur}, ${poids} Ko\n`,
);

// Un anneau écarté à tort laisse un pont de terre au milieu d'une rivière :
// le détail des rejets se lit ici, pas dans le rendu.
for (const { nom, anneaux } of eaux) {
  const gardes = anneaux.filter(retenu).length;
  const horsCadre = anneaux.filter((a) => !toucheLeCadre(a)).length;
  const isoles = anneaux.filter(
    (a) => toucheLeCadre(a) && !reseau.has(a),
  ).length;
  console.log(
    `  ${nom.padEnd(24)} ${String(gardes).padStart(3)} gardés,` +
      ` ${String(horsCadre).padStart(3)} hors cadre,` +
      ` ${String(isoles).padStart(3)} isolés`,
  );
}
