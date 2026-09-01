# mariane-danse

Site vitrine de **Mariane Carlo Rollot**, instructrice de Zumba à Laval.

Zumba Gold pour les aînés, Zumba Kids, cours mamans-bébés et animations
d'événements — à Laval, Montréal et sur la Rive-Nord.

En production sur **<https://marianedanse.ca>**. `www` et `mariannedanse.ca`
(deux `n`) y redirigent en 301.

## Démarrer

```bash
pnpm install
pnpm dev
```

Le site tourne sur <http://localhost:4321>.

## Vérifier avant de pousser

```bash
pnpm check
```

Formatage, ESLint, types, Knip, build, typographie québécoise, tests Playwright
sur Chromium et WebKit, puis budgets Lighthouse. C'est exactement ce que la CI
exécute, dans le même ordre : si ça passe en local, ça passe en CI.

Lighthouse s'appuie sur le Chrome téléchargé par Puppeteer à l'installation, pas
sur celui de la machine : les scores sont donc les mêmes en local et en CI.

## Déploiement

Chaque pull request obtient une préversion sur Cloudflare Pages ; `main` part en
production. Voir `.github/workflows/deploy.yml`.

Secrets à configurer dans le dépôt :

| Secret                  | Rôle                  |
| ----------------------- | --------------------- |
| `CLOUDFLARE_API_TOKEN`  | Déploiement           |
| `CLOUDFLARE_ACCOUNT_ID` | Déploiement           |
| `PUBLIC_WEB3FORMS_KEY`  | Formulaire de contact |

Sans `PUBLIC_WEB3FORMS_KEY`, **le formulaire ne s'affiche pas** : un bouton
« Envoyer » qui n'envoie rien est pire que pas de bouton. Les courriels
pré-remplis par intention, eux, restent affichés dans tous les cas.

Cloudflare ne bâtit pas depuis le dépôt : c'est GitHub Actions qui vérifie,
puis pousse `dist/`. La raison est dans [CLAUDE.md](./CLAUDE.md).

## Où toucher quoi

Les conventions et les décisions structurantes sont dans [CLAUDE.md](./CLAUDE.md).
