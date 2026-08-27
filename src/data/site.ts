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
  // Bascule quand Mariane aura confirmé qu'elle veut afficher son Instagram
  instagram: {
    actif: false,
    handle: "mariane.danse",
  },
} as const;

export const zonesDesservies = [
  "Laval",
  "Montréal",
  "Sainte-Thérèse",
  "Saint-Eustache",
  "Anjou",
  "Saint-Léonard",
] as const;
