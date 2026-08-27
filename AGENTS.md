# Site de Mariane

Site vitrine de Mariane Rollot Carlo, instructrice de Zumba à Laval.

## À qui s'adresse ce site

**Aux coordonnateurs de loisirs**, en priorité : résidences pour aînés, centres
communautaires, services parascolaires, camps de jour, centres de périnatalité.
C'est de là que vient son revenu. Le grand public est une cible secondaire.

Quand un arbitrage se présente entre « faire joli pour le visiteur curieux » et
« convaincre un coordonnateur de la booker », c'est la deuxième qui gagne.

## Contraintes non négociables

- **Statique.** Aucun serveur, aucune base de données. Tout est généré au build.
- **Accessible.** Le public final, ce sont des aînés : corps de texte à 18 px
  minimum, contraste élevé, cibles tactiles d'au moins 48 px, et toute animation
  derrière `prefers-reduced-motion`.
- **Rapide.** Les budgets Lighthouse sont dans `lighthouserc.json` et bloquent la
  CI. Pas de script tiers, pas de police chargée depuis un CDN.
- **Mobile d'abord.** Mariane montre le site depuis son téléphone, en
  déplacement.
- **Français du Québec.** Une seule langue, pas de version anglaise.

## Structure

```
src/
  data/site.ts        Coordonnées, signature, bascule Instagram
  content/offres/     Une fiche Markdown par type de cours
  content/temoignages/ Un fichier par témoignage (invisible tant que publie: false)
  components/         Une section de page par composant
  layouts/Base.astro  <head>, SEO, slots « tete » / « navigation » / « pied »
  pages/
    index.astro       La page unique
    carte.astro       Page « écran à montrer » : QR + vCard + partage natif
    contact.vcf.ts    Fiche contact générée au build
    confidentialite.astro
```

Le contenu vit dans `src/content/` et `src/data/`, jamais en dur dans un
composant. Pour changer un texte, on ne touche pas au layout.

## Commandes

```bash
pnpm dev            # serveur local sur http://localhost:4321
pnpm check          # format + types + build — à passer avant chaque commit
pnpm check:quality  # budgets Lighthouse (nécessite Chrome, cf. plus bas)
pnpm format         # prettier
```

`pnpm check:quality` s'appuie sur Lighthouse, qui a besoin d'une installation de
Chrome. Elle tourne systématiquement en CI ; en local, elle n'est disponible que
si Chrome est installé (ou si `CHROME_PATH` pointe vers un binaire compatible).

## Décisions déjà prises (ne pas revenir dessus sans raison)

- **Astro**, pour la sortie statique et l'optimisation d'images au build.
- **Cloudflare Pages**, pour les préversions par pull request.
- **Web3Forms** pour le formulaire : un POST HTML sans JavaScript. Sans clé
  configurée, le formulaire retombe sur un `mailto:` — il n'est jamais cassé.
- **Pas de « zumba » dans le nom de domaine** : les conditions Zumba Fitness
  l'interdisent aux instructeurs licenciés. Le mot reste libre dans les textes.
- **La signature « la mère qu'on voit danser » n'est pas le titre principal.**
  Elle ne dit pas le métier et cadre mal avec le public aîné. Le `h1` reste le
  nom, et l'accroche reste explicite pour le référencement.

## En attente

Cherchez `MediaAbsent` et `TODO` : ce sont les emplacements réservés aux photos,
vidéos, témoignages et coordonnées définitives.
