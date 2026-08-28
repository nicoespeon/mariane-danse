import { test, expect } from "@playwright/test";
import { PAGES } from "./pages";

// Les contraintes non négociables d'AGENTS.md, transformées en assertions :
// une régression sur l'une d'elles casse le build plutôt que la lecture.
const CORPS_MINIMUM_PX = 18;
const CIBLE_TACTILE_MINIMUM_PX = 48;

for (const { chemin, nom } of PAGES) {
  test.describe(nom, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(chemin);
    });

    test("ne déborde jamais horizontalement", async ({ page }) => {
      const debordement = await page.evaluate(() => ({
        largeurDuContenu: document.documentElement.scrollWidth,
        largeurDeLEcran: window.innerWidth,
      }));

      expect(debordement.largeurDuContenu).toBeLessThanOrEqual(
        debordement.largeurDeLEcran,
      );
    });

    test("garde un corps de texte lisible sans zoomer", async ({ page }) => {
      const taille = await page.evaluate(
        () => getComputedStyle(document.body).fontSize,
      );

      expect(Number.parseFloat(taille)).toBeGreaterThanOrEqual(
        CORPS_MINIMUM_PX,
      );
    });

    test("offre des cibles tactiles assez grandes", async ({ page }) => {
      const tropPetites = await page.evaluate((minimum) => {
        const interactifs = document.querySelectorAll<HTMLElement>(
          "a[href], button, input, textarea",
        );

        const estUnLienDansUnePhrase = (element: HTMLElement) =>
          element.tagName === "A" &&
          getComputedStyle(element).display === "inline";

        const estCacheAuxHumains = (element: HTMLElement) =>
          element.getAttribute("aria-hidden") === "true" ||
          element.getAttribute("tabindex") === "-1";

        return [...interactifs]
          .filter((element) => element.offsetParent !== null)
          .filter((element) => !estUnLienDansUnePhrase(element))
          .filter((element) => !estCacheAuxHumains(element))
          .map((element) => ({
            element:
              element.textContent?.trim().slice(0, 40) ||
              element.getAttribute("aria-label") ||
              element.tagName,
            hauteur: Math.round(element.getBoundingClientRect().height),
          }))
          .filter(({ hauteur }) => hauteur > 0 && hauteur < minimum);
      }, CIBLE_TACTILE_MINIMUM_PX);

      expect(tropPetites).toEqual([]);
    });

    test("a exactement un titre de premier niveau", async ({ page }) => {
      await expect(page.locator("h1")).toHaveCount(1);
    });
  });
}
