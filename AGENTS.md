# Site de Mariane

Site vitrine de Mariane Rollot Carlo, instructrice de Zumba à Laval.

## À qui s'adresse ce site

**Aux coordonnateurs de loisirs**, en priorité : résidences pour aînés, centres
communautaires, services parascolaires, camps de jour, centres de périnatalité.
C'est de là que vient la quasi-totalité de son revenu — pas des particuliers.

Le point de départ du projet était un Linktree, qui optimise pour « suis-moi ».
Ce site optimise pour « bookez-la ». Quand un arbitrage se présente entre faire
joli pour le visiteur curieux et convaincre un coordonnateur, c'est la deuxième
qui gagne. Le grand public reste une cible secondaire, servie surtout par
`/carte`.

## Marque

La signature est **« la mère qu'on voit danser »**, jeu de mots sur Trenet.

Elle n'est **pas** le titre principal : elle ne dit pas le métier et cadre mal
avec le public aîné, qui est le plus gros segment. Le `h1` reste le nom, et
l'accroche reste explicite pour le référencement.

Le jeu de mots ouvre le système visuel — **mer et soleil** : ondulations,
vagues entre les sections, dégradés chauds, un soleil dans le hero. « Un vrai
soleil » est aussi la qualité qu'on lui attribue le plus souvent, donc la
métaphore tient des deux côtés.

Un peu de fantaisie est souhaitée (dans l'esprit de Josh Comeau), jamais au prix
de la lisibilité.

## Contraintes non négociables

- **Statique.** Aucun serveur, aucune base de données. Tout est généré au build.
- **Accessible.** Le public final, ce sont des aînés : corps de texte à 18 px
  minimum, contraste élevé, cibles tactiles d'au moins 48 px, et toute animation
  derrière `prefers-reduced-motion`. Le budget Lighthouse exige **100** en
  accessibilité — ce n'est pas un objectif, c'est un mur.
- **Rapide.** Pas de script tiers, pas de police chargée depuis un CDN.
- **Mobile d'abord.** Mariane montre le site depuis son téléphone, en
  déplacement, souvent juste après un cours.
- **Français du Québec.** Une seule langue, pas de version anglaise, et la
  typographie d'ici — voir la section ci-dessous.

## Français du Québec

La typographie québécoise n'est pas la française, et c'est le piège classique :
au Québec, **pas d'espace devant `?`, `!` et `;`**. L'espace insécable, elle,
reste obligatoire devant `:` et `%`, et à l'intérieur des guillemets.

| Écrire                                         | Pas                        |
| ---------------------------------------------- | -------------------------- |
| `Vous cherchez un cours?`                      | `un cours ?`               |
| `Merci!`                                       | `Merci !`                  |
| `Le plus rapide&nbsp;: choisir`                | `Le plus rapide : choisir` |
| `«&nbsp;la mère qu'on voit danser&nbsp;»`      | `« la mère… »`             |
| `45&nbsp;min`, `9&nbsp;h&nbsp;30`, `25&nbsp;$` | `45min`, `9h30`, `25$`     |

Le tiret cadratin `—` garde ses espaces. Les majuscules gardent leurs accents
(`À`, `É`). « Numéro » s'abrège `n` suivi d'un `o` en exposant, jamais `n°`.

`pnpm check` fait échouer le build sur ces fautes : `scripts/typographie.mjs`
relit le HTML produit — donc ce que le visiteur lit, quelle que soit la source.

## Structure

```
src/
  data/site.ts         Coordonnées, signature, bascule Instagram
  content/offres/      Une fiche Markdown par type de cours
  content/temoignages/ Un fichier par témoignage (masqué tant que publie: false)
  components/          Une section de page par composant
  layouts/Base.astro   <head>, SEO, slots « tete » / « navigation » / « pied »
  pages/
    index.astro        La page unique
    carte.astro        Page « écran à montrer » : QR + vCard + partage natif
    contact.vcf.ts     Fiche contact générée au build
    confidentialite.astro
```

Le contenu vit dans `src/content/` et `src/data/`, jamais en dur dans un
composant. Pour changer un texte, on ne touche pas au layout.

## Commandes

```bash
pnpm dev            # serveur local sur http://localhost:4321
pnpm check          # format + types + build + Lighthouse — ce que la CI exécute
pnpm format         # prettier
```

`pnpm check` est la porte de sortie : si elle passe, la CI passe. Lighthouse
utilise le Chrome téléchargé par Puppeteer, donc les scores sont identiques en
local et en CI.

## Voir le site pendant qu'on le modifie

Le panneau navigateur démarre le serveur via `.claude/launch.json` :
`preview_start` avec `{"name": "site"}`, depuis la racine du dépôt.

Une bizarrerie à connaître : **une capture d'écran après un défilement revient
vide.** Le panneau ne repeint que sur navigation ou sur changement du DOM. Pour
voir une section basse, agrandir la fenêtre à la hauteur de la page entière
(`resize_window` en 1200 × 6900, par exemple) puis naviguer — la page tient dans
une seule capture. Pour un gros plan, supprimer les sections du dessus avec
`javascript_tool` : la suppression provoque un repaint, contrairement au
défilement.

## Décisions déjà prises

Ne pas revenir dessus sans raison explicite.

- **Astro**, pour la sortie statique et l'optimisation d'images au build.
- **Cloudflare Pages**, pour les préversions par pull request — c'est ce qui
  permet de valider un changement sur une vraie URL avant qu'il touche la prod.
- **Web3Forms** pour le formulaire : un POST HTML sans JavaScript. Sans clé
  configurée, le formulaire retombe sur un `mailto:` — il n'est jamais cassé.
- **Courriels pré-remplis par intention** plutôt qu'un champ vide : le visiteur
  choisit qui il est, le message s'écrit tout seul, il n'a plus qu'à envoyer.
- **Une seule page** plus `/carte` et `/confidentialite`. Pas de menu à tiroirs.
- **Zone desservie dessinée, pas capturée.** `CarteZone.astro` trace les vrais
  contours de l'île de Montréal, de l'île Jésus et de la Rive-Nord. Ils viennent
  d'OpenStreetMap via `scripts/contours.mjs`, et sont figés dans
  `src/data/contours.ts` : le build reste hors ligne, la carte pèse dix
  kilo-octets, elle est aux couleurs du site et échappe aux conditions
  d'utilisation de Google Maps. Pour ajouter une ville, il suffit de l'ajouter
  à `zonesDesservies` ; pour changer un territoire, on modifie `TERRITOIRES`
  dans le script et on le relance.
  Deux pièges déjà payés : les frontières **administratives** englobent l'eau,
  donc les rivières disparaissent et les îles ne se lisent plus — d'où
  `place=island` pour Montréal et Laval. Et le nom des territoires est posé en
  **HTML par-dessus** le SVG : à l'intérieur, il rétrécit avec la carte et
  devient illisible sur téléphone.
- **Pas de rayon de déplacement.** Il partait du domicile de Mariane, une
  information privée, et « 25 minutes autour de Laval » ne voulait rien dire —
  l'autre bout de Laval est déjà à 25 minutes. On nomme les territoires.
- **Licence ZIN affichée en texte, sans logo.** Numéro de membre plus un lien
  vers l'annuaire officiel. Pas de date de validité affichée : elle se renouvelle
  chaque année et deviendrait fausse toute seule.

## Contraintes externes à respecter

- **Jamais « zumba » dans le nom de domaine.** Les conditions des instructeurs
  licenciés Zumba Fitness l'interdisent. Le mot reste libre dans les textes de
  la page, où il est même attendu.
- **Droit à l'image.** Mariane a confirmé que les médias qu'elle fournit sont
  dégagés. Pour toute nouvelle prise de vue, garder le réflexe : Mariane nette
  au premier plan, participants de dos ou en flou de mouvement.
- **Attribution OpenStreetMap.** Les contours sont sous ODbL : le crédit sous
  la carte n'est pas décoratif, il est exigé par la licence.
- **Loi 25.** Le formulaire transite hors Québec, d'où la mention sous le
  formulaire et la page `/confidentialite`. Pas de bannière de témoins tant
  qu'on n'ajoute aucun outil de mesure traçant.

## Ce qui manque encore

Cherchez `MediaAbsent` et `TODO`.

- **Photos et vidéos** : tous les emplacements sont réservés et légendés avec ce
  qu'on attend à chaque endroit.
- **Témoignages** : la section disparaît du build tant qu'aucun n'a `publie: true`.
- **Déploiement** : les secrets Cloudflare ne sont pas encore configurés, donc le
  job de déploiement se saute tout seul. `marianedanse.ca` et `mariannedanse.ca`
  sont réservés chez Rebel.ca et restent à brancher.

## Suivi

Le projet est piloté dans Notion, sous « Faire un site web pour Mariane » dans
le Projects Hub de Nicolas.
