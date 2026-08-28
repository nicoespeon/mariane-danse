import { defineConfig, devices } from "@playwright/test";

// On teste la sortie de production, pas le serveur de développement. Et on la
// sert avec sirv plutôt qu'avec `astro preview` : celui-ci se démonise, donc
// Playwright voit son processus mourir aussitôt et abandonne.
//
// `--dev` n'est pas un détail : sans lui, sirv met en cache la taille des
// fichiers à son démarrage et sert ensuite un build plus récent tronqué à
// l'ancienne longueur. Port dédié aussi, pour ne jamais hériter d'un serveur
// lancé avant le build.
const PORT = 4332;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}` },

  // Mariane montre le site depuis son téléphone : le rendu mobile n'est pas
  // une variante, c'est le cas principal.
  projects: [
    { name: "telephone", use: devices["iPhone 13"] },
    { name: "bureau", use: devices["Desktop Chrome"] },
  ],

  webServer: {
    command: `pnpm exec sirv dist --port ${PORT} --quiet --dev`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});
