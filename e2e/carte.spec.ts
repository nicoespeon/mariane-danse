import { test, expect } from "@playwright/test";
import QRCode from "qrcode";

// Tout l'intérêt de la page tient à une chose : ce que le code contient. Une
// divergence entre le code affiché et le fichier téléchargé ne se voit pas à
// l'œil — elle se découvre le jour où quelqu'un scanne et n'obtient rien.
const traceDuCode = (svg: string) => svg.match(/ d="([^"]+)"/u)?.[1];

test.describe("carte de visite", () => {
  test("le code QR encode exactement la fiche servie", async ({
    page,
    request,
  }) => {
    const fiche = await (await request.get("/contact.vcf")).text();
    const attendu = await QRCode.toString(fiche, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#14262c", light: "#0000" },
    });

    await page.goto("/carte/");
    const affiche = await page
      .locator(".carte__qr svg")
      .evaluate((svg) => svg.outerHTML);

    expect(traceDuCode(affiche)).toBe(traceDuCode(attendu));
  });

  test("la fiche porte le nom, le téléphone et l'adresse du site", async ({
    request,
  }) => {
    const fiche = await (await request.get("/contact.vcf")).text();

    expect({
      nom: fiche.includes("FN:Mariane Carlo Rollot"),
      telephone: fiche.includes("TEL;TYPE=CELL:+14385025492"),
      courriel: fiche.includes(
        "EMAIL;TYPE=INTERNET:marianecarlo1705@gmail.com",
      ),
      site: /^URL:https?:\/\/\S+$/mu.test(fiche),
    }).toEqual({ nom: true, telephone: true, courriel: true, site: true });
  });

  test("propose de récupérer la fiche sans passer par le code", async ({
    page,
  }) => {
    await page.goto("/carte/");

    await expect(
      page.getByRole("link", { name: "Ajouter à mes contacts" }),
    ).toHaveAttribute("href", "/contact.vcf");
  });
});
