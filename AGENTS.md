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
- **Versions figées.** Toute dépendance s'installe avec une version exacte —
  `.npmrc` porte `save-exact=true`, donc `pnpm add` s'en charge. Node et pnpm
  sont épinglés dans `.tool-versions`. Ce site doit encore se construire dans
  trois ans sans surprise.
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

Il surveille aussi l'espace **manquante** après une ponctuation. Astro mange
l'espace entre du texte et l'élément qui suit, ce qui donne des
« Zumba Gold®.Voir sa fiche » invisibles à la relecture — deux ont déjà été
livrées ainsi. Le remède est un `{" "}` explicite avant l'élément.

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
    carte.astro        Page « écran à montrer » : QR + partage natif
    contact.vcf.ts     Fiche contact générée au build
    confidentialite.astro
```

Le contenu vit dans `src/content/` et `src/data/`, jamais en dur dans un
composant. Pour changer un texte, on ne touche pas au layout.

## Commandes

```bash
pnpm dev            # serveur local sur http://localhost:4321
pnpm check          # tout ce que la CI exécute, dans le même ordre
pnpm format         # prettier
```

`pnpm check` est la porte de sortie : la CI ne lance rien d'autre que cette
commande, donc si elle passe en local, elle passe en CI. Elle enchaîne :

| Étape           | Ce qu'elle empêche                                          |
| --------------- | ----------------------------------------------------------- |
| `format:check`  | du style qui diverge d'une machine à l'autre                |
| `check:lint`    | ESLint : variables mortes, `console.log` oublié             |
| `check:types`   | `astro check`                                               |
| `check:morts`   | Knip : un fichier ou un export que plus personne n'importe  |
| `build`         |                                                             |
| `check:typo`    | la typographie française au lieu de la québécoise           |
| `check:e2e`     | Playwright : accessibilité, rendu mobile, liens, formulaire |
| `check:quality` | Lighthouse : performance, accessibilité, SEO                |

Lighthouse utilise le Chrome téléchargé par Puppeteer, donc les scores sont
identiques en local et en CI.

Les tests E2E servent `dist/` avec `sirv`, pas avec `astro preview` : ce dernier
se démonise, donc Playwright voit son processus mourir aussitôt et abandonne.
Toujours avec `--dev` : sinon sirv met en cache la taille des fichiers à son
démarrage et sert ensuite un build plus récent **tronqué** à l'ancienne
longueur — page blanche, ou « Parse Error: Expected HTTP/ » dans les tests.
Deux navigateurs, Chromium et WebKit — WebKit parce que Mariane montre le site
depuis son téléphone, et que c'est Safari qui s'y exécute.

## Voir le site pendant qu'on le modifie

Le panneau navigateur démarre le serveur via `.claude/launch.json` :
`preview_start` avec `{"name": "site"}`, depuis la racine du dépôt.

**Le serveur de développement sert du CSS périmé.** Modifier un bloc `<style>`
d'un composant met à jour le HTML mais pas toujours la feuille de style : on
voit alors une version à moitié appliquée, et on part corriger un bug qui
n'existe pas. C'est arrivé deux fois. Pour juger un rendu, servir le build :

```bash
pnpm build && pnpm servir     # ou preview_start avec {"name": "apercu"}
```

Une autre bizarrerie : **une capture d'écran après un défilement revient
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
- **Web3Forms** pour le formulaire : un POST HTML sans JavaScript. C'est le
  seul chemin de contact qui ne suppose rien chez le visiteur — un `mailto:`
  reste muet pour qui lit son courriel dans un navigateur.
  Sans clé configurée, le formulaire **ne s'affiche pas** : posté vers
  `mailto:`, il ne faisait rien dans Chrome ni Safari, et un bouton
  « Envoyer » qui n'envoie rien est pire que pas de bouton. La page
  `/confidentialite` suit la même bascule, pour ne pas décrire un relais
  absent. Les courriels par intention, eux, restent là dans tous les cas.
- **Courriels pré-remplis par intention** plutôt qu'un champ vide : le visiteur
  choisit qui il est, le message s'écrit tout seul, il n'a plus qu'à envoyer.
- **Une seule page** plus `/carte` et `/confidentialite`. Pas de menu à tiroirs.
- **Le code QR de `/carte` encode la fiche de contact, pas l'adresse du site.**
  Mariane tend son téléphone, la personne scanne, Mariane est dans son
  répertoire — sans réseau, sans téléchargement, sans passer par le site.
  L'adresse du site voyage dans la fiche, donc rien n'est perdu. Une seule
  source, `src/data/fiche-contact.ts`, sert le code et le fichier `.vcf` ; un
  test E2E réencode la fiche servie et compare les deux tracés, parce qu'une
  divergence ne se voit pas à l'œil.
  Pas de champ `NOTE` : chaque champ densifie le code, et à cette taille c'est
  ce qui décide si un téléphone le lit du premier coup. On reste en version 11
  (61 × 61 modules).
  Les boutons sous le code servent l'autre entrée : quelqu'un à qui Mariane a
  envoyé le lien, et qui lit déjà la page sur son téléphone.
- **Zone desservie dessinée, pas capturée.** `CarteZone.astro` trace les vrais
  contours de l'île de Montréal, de l'île Jésus et de la Rive-Nord. Ils viennent
  d'OpenStreetMap via `scripts/contours.mjs`, et sont figés dans
  `src/data/contours.ts` : le build reste hors ligne, la carte pèse dix
  kilo-octets, elle est aux couleurs du site et échappe aux conditions
  d'utilisation de Google Maps. Pour ajouter une ville, il suffit de l'ajouter
  à `zonesDesservies` ; pour changer un territoire, on modifie `TERRITOIRES`
  dans le script et on le relance.
  Cinq pièges déjà payés :
  1. Les frontières **administratives** englobent l'eau : les rivières
     disparaissent et les îles ne se lisent plus. D'où `place=island` pour
     Montréal, Laval et l'île Bizard, et une couche d'eau par-dessus les
     rives. Le fleuve n'a pas de relation nommée — autour de Montréal, c'est
     un assemblage de surfaces `water=river` anonymes que Nominatim n'indexe
     pas. Le script passe par Overpass et recolle les anneaux lui-même.
     Simplifier les lacs plus grossièrement que les terres ne marche pas
     non plus : la rive sud du lac Saint-Louis avalait Châteauguay.
  2. **Aucun contour** sur les terres. Le trait foncé faisait tout le bruit, et
     il dessinait des limites de MRC que personne ne voit sur le terrain. Sans
     lui, les rives voisines fondent en une seule masse et le cadre fixe rejette
     leurs limites hors champ.
  3. Le liseré des îles est **de la couleur de l'eau**, celui des rives de la
     couleur de la terre : les premières s'érodent, ce qui élargit la rivière
     des Prairies — un cheveu à cette échelle, mais c'est elle qui fait lire
     l'île de Montréal. Les secondes se soudent entre elles.
  4. Une requête Nominatim mal cadrée ramène autre chose que le territoire —
     « Roussillon (MRC) » rendait le **bâtiment** de la MRC, rue Saint-Pierre,
     et le trou d'eau qui en résultait est passé inaperçu. Le script filtre
     désormais sur `class=boundary` et refuse tout contour réduit à moins de
     huit points.
  5. Les noms sont en **HTML par-dessus** le SVG, et n'apparaissent qu'au-delà
     de 27 rem de large (requête de conteneur, pas de média : la carte occupe
     toute la largeur sur téléphone et moins de la moitié sur grand écran).
     Six noms sur 275 px se marchent dessus ; en dessous, la légende prend le
     relais.
- **Deux listes de villes, deux promesses.** `villesOuElleEnseigne` porte des
  coordonnées et devient un point sur la carte : c'est une preuve, on n'y met
  que des villes où Mariane donne effectivement des cours.
  `autresVillesDesservies` décrit le territoire qu'elle couvre, sans
  coordonnées — elle ne pose aucun point, elle alimente le `areaServed` du
  JSON-LD et la phrase en bas de la section « Où ». Ne pas les fusionner :
  chaque ville ajoutée à la première affirme qu'elle y enseigne.
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
