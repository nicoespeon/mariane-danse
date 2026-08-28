import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PAGES } from "./pages";

// Le public final, ce sont des aînés : l'accessibilité n'est pas un objectif,
// c'est un mur. Lighthouse note la page ; axe dit quel élément est en cause.
for (const { chemin, nom } of PAGES) {
  test(`${nom} n'a aucune violation d'accessibilité`, async ({ page }) => {
    await page.goto(chemin);

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      violations.map((violation) => ({
        regle: violation.id,
        elements: violation.nodes.map((noeud) => noeud.target.join(" ")),
      })),
    ).toEqual([]);
  });
}
