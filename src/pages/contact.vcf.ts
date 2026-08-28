import type { APIRoute } from "astro";
import { site } from "../data/site";

// Un tap, et Mariane est dans le répertoire. Généré au build, servi en statique.
export const GET: APIRoute = ({ site: origine }) => {
  const [prenom, ...restePrenom] = site.nom.split(" ");
  const nomFamille = restePrenom.join(" ");

  const nomDuFichier = `${site.nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/gu, "-")}.vcf`;

  const carte = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${nomFamille};${prenom};;;`,
    `FN:${site.nom}`,
    `TITLE:${site.metier}`,
    `EMAIL;TYPE=INTERNET:${site.courriel}`,
    `TEL;TYPE=CELL:${site.telephone}`,
    origine ? `URL:${origine.href}` : "",
    `NOTE:${site.accroche}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(carte, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomDuFichier}"`,
    },
  });
};
