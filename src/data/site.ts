export const site = {
  // L'ordre de ses cartes de visite
  nom: "Mariane Carlo Rollot",
  metier: "Instructrice de Zumba et de danse",
  signature: "la mère qu'on voit danser",
  accroche:
    "Cours de Zumba pour aînés, enfants et familles — Laval, Montréal et la Rive-Nord",
  courriel: "marianecarlo1705@gmail.com",
  telephone: "+14385025492",
  telephoneAffiche: "(438) 502-5492",
  ville: "Laval, Québec",
  instagram: {
    actif: true,
    handle: "la_mere_quon_voit_danser",
  },
} as const;

// Le certificat mentionne une date de validité qui se renouvelle chaque année :
// on affiche le numéro, qui lui ne bouge pas, et on laisse zumba.com faire foi.
export const licence = {
  zinId: "4513608",
  profil: "https://www.zumba.com/en-US/p/mariane-carlo/4513608",
  intitules: ["Zumba®", "Zumba Gold®"],
} as const;

// Deux listes, deux promesses différentes. Celle-ci porte des coordonnées et
// devient un point sur la carte : c'est une preuve, elle ne contient que des
// villes où Mariane donne effectivement des cours.
export const villesOuElleEnseigne = [
  { nom: "Laval", latitude: 45.606, longitude: -73.712 },
  { nom: "Sainte-Thérèse", latitude: 45.64, longitude: -73.851 },
  { nom: "Saint-Eustache", latitude: 45.565, longitude: -73.905 },
  { nom: "Anjou", latitude: 45.614, longitude: -73.554 },
  { nom: "Saint-Léonard", latitude: 45.588, longitude: -73.598 },
  { nom: "Montréal", latitude: 45.508, longitude: -73.561 },
] as const;

// Celle-là décrit le territoire qu'elle couvre — « Laval, Montréal et la
// Rive-Nord », en nommant les villes que les gens d'ici reconnaissent. Pas de
// coordonnées : elle ne pose aucun point sur la carte, elle nourrit le
// référencement local et la phrase de la section « Où Mariane se déplace ».
export const autresVillesDesservies = [
  "Blainville",
  "Boisbriand",
  "Rosemère",
  "Lorraine",
  "Bois-des-Filion",
  "Deux-Montagnes",
  "Sainte-Marthe-sur-le-Lac",
  "Terrebonne",
] as const;
