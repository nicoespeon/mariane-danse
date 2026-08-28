import { test, expect } from "@playwright/test";

// Le formulaire n'est jamais envoyé pour de vrai : la cible est la boîte de
// Mariane. On vérifie son contrat — ce que le navigateur enverrait.
//
// Sans clé Web3Forms configurée, il ne s'affiche pas : un formulaire qui
// poste vers `mailto:` ne fait rien dans Chrome ni Safari, et les tests
// tournent justement sans clé. D'où un invariant qui vaut dans les deux cas,
// puis des vérifications qui ne s'appliquent que si le formulaire est là.
const ACTION_ATTENDUE = "https://api.web3forms.com/submit";

test.describe("formulaire de contact", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("ne montre jamais un formulaire qui n'aboutit nulle part", async ({
    page,
  }) => {
    const cibles = await page
      .locator("form")
      .evaluateAll((formulaires) =>
        formulaires.map((formulaire) => formulaire.getAttribute("action")),
      );

    expect(cibles.filter((cible) => cible !== ACTION_ATTENDUE)).toEqual([]);
  });

  test("laisse toujours une autre façon de joindre Mariane", async ({
    page,
  }) => {
    const contact = page.locator("#contact");

    await expect(contact.locator(".intention")).toHaveCount(3);
    await expect(contact.locator("a[href^='tel:']")).toBeVisible();
  });

  test.describe("quand la clé Web3Forms est configurée", () => {
    test.beforeEach(async ({ page }) => {
      const present = await page.locator("form.formulaire").count();
      test.skip(present === 0, "aucune clé Web3Forms dans cet environnement");
    });

    test("expose trois champs obligatoires et étiquetés", async ({ page }) => {
      const formulaire = page.locator("form.formulaire");

      for (const etiquette of [
        "Votre nom",
        "Votre courriel",
        "Votre message",
      ]) {
        const champ = formulaire.getByLabel(etiquette);
        await expect(champ, `champ « ${etiquette} »`).toBeVisible();
        await expect(champ, `champ « ${etiquette} »`).toHaveAttribute(
          "required",
          "",
        );
      }
    });

    // Sans ce champ, Web3Forms renvoie vers sa propre page de confirmation,
    // en anglais — sur un site qui n'a pas de version anglaise. Et sur le plan
    // gratuit, ils refusent toute redirection vers un autre domaine que celui
    // d'où part le formulaire : viser la production depuis une préversion ne
    // marche pas, et échoue en silence.
    test("renvoie vers notre page de remerciement, sur le même domaine", async ({
      page,
    }) => {
      const redirection = page.locator(
        "form.formulaire input[name='redirect']",
      );

      const cible = await redirection.inputValue();
      const origineDeLaPage = new URL(page.url()).origin;

      expect(cible).toBe(new URL("/merci/", origineDeLaPage).href);

      const reponse = await page.request.get("/merci/");
      expect(reponse.status()).toBe(200);
    });

    test("porte la clé qui autorise l'envoi", async ({ page }) => {
      const cle = page.locator("form.formulaire input[name='access_key']");

      await expect(cle).toBeAttached();
      await expect(cle).not.toHaveValue("");
    });

    test("cache son piège à robots aux humains", async ({ page }) => {
      const piege = page.locator("form.formulaire input[name='botcheck']");

      await expect(piege).toBeAttached();
      await expect(piege).toHaveAttribute("tabindex", "-1");
      await expect(piege).toHaveAttribute("aria-hidden", "true");

      const boite = (await piege.boundingBox()) ?? { width: 0, height: 0 };
      expect(Math.max(boite.width, boite.height)).toBeLessThanOrEqual(1);
    });

    test("annonce où vont les coordonnées", async ({ page }) => {
      const mention = page.locator(".formulaire__mention");

      await expect(mention).toContainText("courriel");
      await expect(
        mention.locator("a[href='/confidentialite/']"),
      ).toBeVisible();
    });
  });
});
