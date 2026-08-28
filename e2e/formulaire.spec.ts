import { test, expect } from "@playwright/test";

// Le formulaire n'est jamais envoyé pour de vrai : la cible est la boîte de
// Mariane. On vérifie donc son contrat — ce que le navigateur enverrait — et
// le repli en `mailto:` quand aucune clé Web3Forms n'est configurée.
test.describe("formulaire de contact", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("expose trois champs obligatoires et étiquetés", async ({ page }) => {
    const formulaire = page.locator("form.formulaire");

    for (const etiquette of ["Votre nom", "Votre courriel", "Votre message"]) {
      const champ = formulaire.getByLabel(etiquette);
      await expect(champ, `champ « ${etiquette} »`).toBeVisible();
      await expect(champ, `champ « ${etiquette} »`).toHaveAttribute(
        "required",
        "",
      );
    }
  });

  test("part vers Web3Forms, ou retombe sur un courriel", async ({ page }) => {
    const action = await page.locator("form.formulaire").getAttribute("action");

    expect(action).toMatch(/^(https:\/\/api\.web3forms\.com\/submit|mailto:)/);
  });

  test("cache son piège à robots aux humains", async ({ page }) => {
    const piege = page.locator("form.formulaire input[name='botcheck']");

    await expect(piege).toBeAttached();
    await expect(piege).toHaveAttribute("tabindex", "-1");
    await expect(piege).toHaveAttribute("aria-hidden", "true");

    const boite = (await piege.boundingBox()) ?? { width: 0, height: 0 };
    expect(Math.max(boite.width, boite.height)).toBeLessThanOrEqual(1);
  });

  test("annonce où partent les coordonnées", async ({ page }) => {
    const mention = page.locator(".formulaire__mention");

    await expect(mention).toContainText("courriel");
    await expect(mention.locator("a[href='/confidentialite/']")).toBeVisible();
  });

  test("accepte une saisie complète sans rien bloquer", async ({ page }) => {
    const formulaire = page.locator("form.formulaire");

    await formulaire.getByLabel("Votre nom").fill("Chantal Tremblay");
    await formulaire
      .getByLabel("Votre courriel")
      .fill("chantal@residence-exemple.ca");
    await formulaire
      .getByLabel("Votre message")
      .fill("Bonjour, nous cherchons un cours hebdomadaire.");

    // `checkValidity` dit ce que le navigateur ferait au clic sur Envoyer,
    // sans envoyer quoi que ce soit.
    expect(
      await formulaire.evaluate((element: HTMLFormElement) =>
        element.checkValidity(),
      ),
    ).toBe(true);
  });
});
