# mariane-danse

Site vitrine de **Mariane Rollot Carlo**, instructrice de Zumba à Laval.

Zumba Gold pour les aînés, Zumba Kids, cours mamans-bébés et animations
d'événements — à Laval, Montréal et sur la Rive-Nord.

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

Formatage, types et build.

```bash
pnpm check:quality
```

Budgets Lighthouse : performance, accessibilité, SEO. Nécessite Chrome en local
— la CI l'exécute de toute façon à chaque pull request.

## Déploiement

Chaque pull request obtient une préversion sur Cloudflare Pages ; `main` part en
production. Voir `.github/workflows/deploy.yml`.

Secrets à configurer dans le dépôt :

| Secret                  | Rôle                               |
| ----------------------- | ---------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Déploiement                        |
| `CLOUDFLARE_ACCOUNT_ID` | Déploiement                        |
| `PUBLIC_WEB3FORMS_KEY`  | Formulaire de contact (facultatif) |

Sans `PUBLIC_WEB3FORMS_KEY`, le formulaire bascule sur un `mailto:`.

## Où toucher quoi

Les conventions et les décisions structurantes sont dans [CLAUDE.md](./CLAUDE.md).
