import { test, expect, type Page } from "@playwright/test";
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

// Les noms de villes sont posés en HTML par-dessus le SVG, à des coordonnées
// calculées : deux qui se chevauchent ne cassent rien, ils rendent juste la
// carte illisible. Le seuil qui les fait apparaître se règle au pixel près,
// d'où ce filet.
test("ne laisse jamais deux noms de villes se chevaucher", async ({ page }) => {
  await page.goto("/");

  const chevauchements = await page
    .locator(".zone__nom")
    .evaluateAll((etiquettes) => {
      const visibles = etiquettes
        .filter((etiquette) => etiquette.checkVisibility())
        .map((etiquette) => ({
          nom: etiquette.textContent?.trim() ?? "",
          boite: etiquette.getBoundingClientRect(),
        }));

      return visibles.flatMap((un, index) =>
        visibles.slice(index + 1).flatMap((autre) => {
          const separes =
            un.boite.right <= autre.boite.left ||
            autre.boite.right <= un.boite.left ||
            un.boite.bottom <= autre.boite.top ||
            autre.boite.bottom <= un.boite.top;
          return separes ? [] : [`${un.nom} ↔ ${autre.nom}`];
        }),
      );
    });

  expect(chevauchements).toEqual([]);
});

// Ce qu'on promet sous prefers-reduced-motion, ce n'est pas « la carte reste
// lisible » — elle l'est de toute façon une fois la cascade finie — c'est
// qu'aucun point ne bouge. Seule la déclaration le dit; une capture prise
// après coup ne distingue pas les deux cas.
const villesAnimees = (page: Page) =>
  page
    .locator(".zone__point, .zone__nom")
    .evaluateAll((elements) =>
      elements
        .filter((element) => getComputedStyle(element).animationName !== "none")
        .map(
          (element) =>
            element.textContent?.trim() ||
            `point ${element.getAttribute("cx")}`,
        ),
    );

test.describe("carte des villes", () => {
  // Sans ce cas, les deux suivants passeraient encore après la suppression
  // pure et simple de la cascade.
  test("anime ses points quand elle entre dans le champ", async ({ page }) => {
    await page.goto("/");
    await page.locator(".zone").scrollIntoViewIfNeeded();

    await expect(page.locator(".zone")).toHaveClass(/zone--anime/u);
    expect(await villesAnimees(page)).not.toEqual([]);
  });

  test.describe("sans JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("montre ses villes sans rien animer", async ({ page }) => {
      await page.goto("/");

      expect(await villesAnimees(page)).toEqual([]);
    });
  });

  // La préférence s'émule par `page.emulateMedia` et non par
  // `test.use({ reducedMotion })` : en Playwright 1.62 la seconde forme est
  // sans effet, sur Chromium comme sur WebKit, et le test passait alors en
  // vérifiant une règle dans le cas où elle ne s'applique pas.
  test("ne fait bouger aucun point pour qui demande moins d'animations", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator(".zone").scrollIntoViewIfNeeded();

    expect(await villesAnimees(page)).toEqual([]);
  });
});
