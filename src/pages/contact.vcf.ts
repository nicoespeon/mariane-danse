import type { APIRoute } from "astro";
import { ficheContact, nomDuFichierContact } from "../data/fiche-contact";

// Un tap, et Mariane est dans le répertoire. Généré au build, servi en
// statique. Le code QR de /carte encode exactement la même fiche.
export const GET: APIRoute = ({ site: origine }) =>
  new Response(ficheContact(origine), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomDuFichierContact}"`,
    },
  });
