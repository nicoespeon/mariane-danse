import { site } from "./site";

// Une seule fiche pour deux usages : le fichier que la page propose au
// téléchargement, et le contenu même du code QR. Les deux doivent dire
// exactement la même chose, sinon la personne repart avec deux Mariane.
//
// Pas de NOTE : chaque champ densifie le code QR, et à cette taille c'est ce
// qui décide si un téléphone le lit du premier coup ou pas. Le métier tient
// déjà dans TITLE, et l'adresse du site voyage dans le contact.
export const ficheContact = (origine: URL | undefined) => {
  const [prenom, ...nomDeFamille] = site.nom.split(" ");

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${nomDeFamille.join(" ")};${prenom};;;`,
    `FN:${site.nom}`,
    `TITLE:${site.metier}`,
    `EMAIL;TYPE=INTERNET:${site.courriel}`,
    `TEL;TYPE=CELL:${site.telephone}`,
    origine ? `URL:${origine.href}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
};

export const nomDuFichierContact = `${site.nom
  .toLowerCase()
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/\s+/gu, "-")}.vcf`;
