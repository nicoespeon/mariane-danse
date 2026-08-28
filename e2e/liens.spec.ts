import { test, expect } from "@playwright/test";
import { PAGES } from "./pages";

// Un lien mort sur un site de trois pages, c'est une visite perdue. On vérifie
// ce que le visiteur peut cliquer, pas ce qu'on croit avoir écrit.
for (const { chemin, nom } of PAGES) {
  test(`${nom} n'a aucun lien interne cassé`, async ({ page, request }) => {
    await page.goto(chemin);

    const liens = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((lien) => lien.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/")),
    );

    const reponses = await Promise.all(
      [...new Set(liens)].map(async (href) => ({
        href,
        statut: (await request.get(href)).status(),
      })),
    );

    expect(reponses.filter(({ statut }) => statut !== 200)).toEqual([]);
  });

  test(`${nom} n'a aucune ancre qui pointe dans le vide`, async ({ page }) => {
    await page.goto(chemin);

    const ancresPerdues = await page.evaluate(() =>
      [...document.querySelectorAll("a[href^='#']")]
        .map((lien) => lien.getAttribute("href") ?? "")
        .filter((href) => href.length > 1)
        .filter((href) => document.querySelector(href) === null),
    );

    expect(ancresPerdues).toEqual([]);
  });
}

test("la fiche contact se télécharge et porte le bon nom", async ({
  request,
}) => {
  const reponse = await request.get("/contact.vcf");

  expect(reponse.status()).toBe(200);
  expect(await reponse.text()).toContain("FN:Mariane Carlo Rollot");
});

// Le manifeste répétait le nom en dur, dans public/ : il est resté « Mariane
// Rollot Carlo » après le changement d'ordre, et rien ne pouvait le signaler.
// Il est généré depuis src/data/site.ts, et ce test le vérifie.
test("le manifeste porte le nom du site", async ({ page, request }) => {
  await page.goto("/");

  const chemin = await page
    .locator("link[rel='manifest']")
    .getAttribute("href");
  expect(chemin).toBeTruthy();

  const reponse = await request.get(chemin ?? "");
  expect(reponse.status()).toBe(200);

  const nomAffiche = await page.locator(".pied__marque strong").innerText();
  expect((await reponse.json()).name).toContain(nomAffiche);
});
