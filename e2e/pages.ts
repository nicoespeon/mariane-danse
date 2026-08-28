// Les trois pages du site. Toute page ajoutée doit passer les mêmes contrôles.
export const PAGES = [
  { chemin: "/", nom: "accueil" },
  { chemin: "/carte/", nom: "carte de visite" },
  { chemin: "/confidentialite/", nom: "confidentialité" },
] as const;
