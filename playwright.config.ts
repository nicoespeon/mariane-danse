import { defineConfig, devices } from "@playwright/test";

// On teste la sortie de production, pas le serveur de développement. Et on la
// sert avec sirv plutôt qu'avec `astro preview` : celui-ci se démonise, donc
// Playwright voit son processus mourir aussitôt et abandonne.
const PORT = 4331;

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
    command: "pnpm run servir",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
