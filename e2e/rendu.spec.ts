import { test, expect } from "@playwright/test";
import { PAGES } from "./pages";

// Les contraintes non négociables d'AGENTS.md, transformées en assertions :
// une régression sur l'une d'elles casse le build plutôt que la lecture.
const CORPS_MINIMUM_PX = 18;
const CIBLE_TACTILE_MINIMUM_PX = 48;

// 320 px, c'est un iPhone SE ou un Android d'entrée de gamme — exactement le
// téléphone d'une partie du public. Les largeurs intermédiaires ont chacune
// débusqué un débordement que les autres laissaient passer.
const LARGEURS = [320, 390, 768, 1280];

for (const { chemin, nom } of PAGES) {
  test.describe(nom, () => {
    for (const largeur of LARGEURS) {
      test(`ne déborde pas horizontalement à ${largeur} px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largeur, height: 900 });
        await page.goto(chemin);

        const debordement = await page.evaluate(() => {
          const bord = window.innerWidth;

          // `body` masque déjà le débordement horizontal : c'est précisément
          // ce qu'on mesure, donc la remontée s'arrête là. Un parent
          // intermédiaire qui rogne, lui, disqualifie son enfant — le soleil
          // du hero dépasse de 57 px sans que la page bouge d'un pixel.
          const estRogneParUnParent = (element: HTMLElement) => {
            for (
              let parent = element.parentElement;
              parent && parent !== document.body;
              parent = parent.parentElement
            ) {
              if (getComputedStyle(parent).overflowX !== "visible") return true;
            }
            return false;
          };

          return {
            depasseDe: Math.max(
              0,
              document.documentElement.scrollWidth - window.innerWidth,
            ),
            coupables: [...document.querySelectorAll<HTMLElement>("body *")]
              .filter((element) => element.getBoundingClientRect().right > bord)
              .filter((element) => !estRogneParUnParent(element))
              .map((element) => ({
                balise: element.tagName.toLowerCase(),
                classe: element.getAttribute("class"),
                texte: element.textContent?.trim().slice(0, 30),
              })),
          };
        });

        expect(debordement).toEqual({ depasseDe: 0, coupables: [] });
      });
    }

    test.describe("au format du navigateur", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(chemin);
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
          // Un lien dans une phrase a la hauteur de sa ligne, et WCAG
          // l'exempte. La règle vise les cibles posées exprès.
          const estUnLienDansUnePhrase = (element: HTMLElement) =>
            element.tagName === "A" &&
            getComputedStyle(element).display === "inline";

          const estCacheAuxHumains = (element: HTMLElement) =>
            element.getAttribute("aria-hidden") === "true" ||
            element.getAttribute("tabindex") === "-1";

          return [
            ...document.querySelectorAll<HTMLElement>(
              "a[href], button, input, textarea",
            ),
          ]
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
  });
}
