export const site = {
  nom: "Mariane Rollot Carlo",
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

// Point de départ des déplacements, et rayon de route accepté.
export const baseDeDeplacement = {
  nom: "Laval",
  latitude: 45.606,
  longitude: -73.712,
  minutesDeRoute: 25,
  // 25 minutes de route en banlieue montréalaise : environ 25 km
  rayonKm: 25,
} as const;

export const zonesDesservies = [
  { nom: "Laval", latitude: 45.606, longitude: -73.712 },
  { nom: "Sainte-Thérèse", latitude: 45.64, longitude: -73.851 },
  { nom: "Saint-Eustache", latitude: 45.565, longitude: -73.905 },
  { nom: "Anjou", latitude: 45.614, longitude: -73.554 },
  { nom: "Saint-Léonard", latitude: 45.588, longitude: -73.598 },
  { nom: "Montréal", latitude: 45.508, longitude: -73.561 },
] as const;
