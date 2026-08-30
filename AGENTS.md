# Site de Mariane

Site vitrine de Mariane Carlo Rollot, instructrice de Zumba à Laval.

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

## Son parcours, pour écrire juste

Elle enseigne la **Zumba depuis février 2026**. Rien sur le site ne doit
suggérer des années d'expérience en Zumba, ni des organismes qui la
reprennent depuis longtemps.

La danse, elle, est ancienne, et c'est là qu'est la vraie preuve :

- danse classique jusqu'au premier rôle dans _La Veuve Joyeuse_, salle Poirel
  à Nancy ;
- modern jazz, qu'elle enseignait en MJC en France dès 2014 ;
- hip-hop ;
- des saisons de danse en Club Med.

Entre 2018 et 2025 elle a fait autre chose, donc **pas de « depuis 2014 »
continu** : on date les faits, on n'affirme pas une carrière ininterrompue.

Le premier rôle et la salle Poirel ne sont pas sur le site : à un
coordonnateur de Laval, « Nancy » et « opérette » ne disent rien, alors que
« Club Med » et « elle donnait des cours en 2014 » se lisent tout de suite.
Ils resservent le jour où une section « à propos » existera.

### Le ton

Le piège de cette page, c'est la phrase qui claque. Deux fois de suite la
section « Pourquoi faire appel à Mariane » est repartie à la corbeille pour
ça : « ça vient de ses années de danse », « c'est la musique qui fait sortir
les gens de leur chambre ». Le motif est toujours le même — une phrase de
mise en place, puis une chute — et il sonne publicitaire, pas humain.

La règle : **aucune phrase ne doit être une chute.** Concrètement, on évite
les tournures clivées (« c'est X qui… »), le deux-points suivi d'une formule,
les énumérations à trois termes dont le dernier glisse vers l'émotion, les
titres en « X, pas Y » et « Zéro X », et la sagesse toute faite (« ça ne
s'improvise pas »). Le registre parlé d'ici (« elle est du genre à embarquer
le groupe avec elle ») vaut mieux qu'une formule polie.

Deuxième piège, plus sournois : **le détail concret inventé pour faire vrai.**
« même ceux qui étaient venus regarder » a été écrit puis retiré — personne ne
vient regarder un cours de Zumba, et un lecteur qui connaît le métier le sent
tout de suite. Un détail qu'on n'a pas vérifié auprès de Mariane ne va pas sur
la page, même s'il sonne juste.

Et **on ne vend pas la pratique standard.** « Vous n'avez rien à installer »
a été écrit, puis retiré : c'est ce que fait n'importe quel prestataire, et
l'annoncer comme un avantage décote tout le reste de la page.

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
    merci.astro        Après l'envoi du formulaire, à la place de Web3Forms
    carte.astro        Page « écran à montrer » : QR + partage natif
    contact.vcf.ts     Fiche contact générée au build
    manifest.webmanifest.ts  Généré aussi, pour qu'il suive le nom du site
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

  **En dépôt direct, jamais connecté à GitHub.** L'assistant Cloudflare
  propose de bâtir lui-même depuis le dépôt; ne pas accepter. Il déploierait
  sans attendre `pnpm check`, donc un commit qui casse Lighthouse ou les tests
  partirait en production quand même. C'est GitHub Actions qui bâtit, vérifie,
  puis pousse `dist/` avec `wrangler pages deploy`.

  Deux raisons de plus, découvertes en essayant : leur image de build lit
  `.tool-versions` mais **n'a pas le plugin asdf de pnpm**, donc le build
  échoue en huit secondes; et `PUBLIC_WEB3FORMS_KEY` n'existant pas dans leur
  environnement, le formulaire ne se serait pas affiché du tout.

- **Web3Forms** pour le formulaire : un POST HTML sans JavaScript. C'est le
  seul chemin de contact qui ne suppose rien chez le visiteur — un `mailto:`
  reste muet pour qui lit son courriel dans un navigateur.
  Sans clé configurée, le formulaire **ne s'affiche pas** : posté vers
  `mailto:`, il ne faisait rien dans Chrome ni Safari, et un bouton
  « Envoyer » qui n'envoie rien est pire que pas de bouton. La page
  `/confidentialite` suit la même bascule, pour ne pas décrire un relais
  absent. Les courriels par intention, eux, restent là dans tous les cas.

  **La redirection de fin d'envoi doit rester sur le domaine de la page.**
  Sans le champ caché `redirect`, Web3Forms affiche sa propre confirmation, en
  anglais, sur un site qui n'a pas de version anglaise — d'où `/merci`. Mais
  sur le plan gratuit ils n'acceptent que le même domaine : « Cross domain
  redirection requires a paid plan », et le refus est silencieux — on retombe
  simplement sur leur page.

  La valeur écrite au build vise la production ; un script en ligne la recale
  sur `location.origin`, ce qui la rend juste en préversion Cloudflare comme
  en local. Sans JavaScript, la valeur du build reste la bonne en production.
  Ne pas la déduire de `CF_PAGES_URL` : Cloudflare la définit pour **tous**
  les déploiements, production comprise, ce qui enverrait la production vers
  son adresse `.pages.dev` alors que le visiteur est sur le domaine.
  Un test E2E vérifie que la cible et la page partagent la même origine.

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
- **Carte dessinée, pas capturée — et on ne dessine que l'eau.**
  `CarteZone.astro` pose un fond de terre et trace par-dessus les rivières et
  les lacs. Les tracés viennent d'OpenStreetMap via `scripts/contours.mjs` et
  sont figés dans `src/data/contours.ts` : le build reste hors ligne, la carte
  pèse une vingtaine de kilo-octets, elle est aux couleurs du site et échappe
  aux conditions d'utilisation de Google Maps.

  **Ne pas revenir à un dessin des terres.** On l'a fait, et chaque version
  laissait un trou : une MRC oubliée, puis une autre, puis Kahnawake — qui
  n'appartient à aucune MRC. Assembler des frontières administratives, c'est
  s'engager à connaître le découpage entier de la région. L'eau se suffit :
  ce qui n'est pas une rivière ou un lac est de la terre, sans exception à
  tenir à jour, et les îles se lisent par les rivières qui les entourent.

  **La liste des cours d'eau est explicite**, dans `EAUX`. On a essayé de la
  déduire — par zone géographique, par taille, puis par connexité — et aucune
  règle ne tient : un ruisseau qui fait du bruit et un chenal minuscule qui
  empêche l'île de se souder à la Rive-Sud font tous les deux une cinquantaine
  de pixels. Ce qui mérite d'être dessiné, ça se décide. Le script échoue si un
  identifiant OpenStreetMap a disparu, plutôt que de laisser un trou passer.

  Les pièges déjà payés :
  1. Les frontières **administratives englobent l'eau**. C'est ce qui rend
     l'inversion nécessaire.
  2. **Toute l'eau n'est pas en relations** : la voie maritime, qui sépare
     l'île de Montréal de la Rive-Sud, est une simple `way`.
  3. Le fleuve **n'a pas de relation nommée** : autour de Montréal, c'est un
     assemblage de surfaces anonymes. Le script recolle les anneaux lui-même,
     et demande les relations entières plutôt que cadrées — sinon Overpass
     rogne la géométrie et les anneaux ne se referment plus.
  4. Douglas-Peucker mesure les écarts au segment premier→dernier point. Sur
     un **anneau fermé** ces deux points sont confondus, le segment est un
     point, et l'algorithme rabote les lobes larges. On coupe l'anneau en deux
     avant de le simplifier.
  5. Simplifier **trop grossièrement efface les chenaux étroits** : à cent
     mètres près, le passage entre l'île et la Rive-Sud disparaissait.
  6. Les îles du fleuve sont des **anneaux intérieurs** des relations d'eau.
     Sans elles, l'île des Soeurs est peinte comme de l'eau. Le tracé les rend
     en creux grâce à `fill-rule: evenodd`. Le fleuve en compte plus de cent,
     dont la plupart font deux pixels : `ILE_MINIMALE` les écarte.
  7. Le liseré des cours d'eau est **de la couleur de l'eau** : il les
     élargit. À cette échelle la rivière des Prairies fait un cheveu, et c'est
     elle qui fait lire l'île de Montréal.
  8. Les noms de villes sont en **HTML par-dessus** le SVG, et n'apparaissent
     qu'au-delà de 25 rem de large (requête de conteneur, pas de média : la
     carte occupe toute la largeur sur téléphone et moins de la moitié sur
     grand écran). Le seuil se règle au pixel près — à 27 rem, un écran de
     1200 px n'affichait plus aucun nom alors qu'il y avait la place. Un test
     E2E vérifie qu'aucune paire de noms ne se chevauche.
  9. **Overpass renvoie régulièrement 429 ou 504.** Le script réessaie.

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
- **Domaines** : le site vit sur `mariane-danse.pages.dev` depuis le 30 août 2026. `marianedanse.ca` et `mariannedanse.ca` (deux `n`, en redirection)
  sont réservés chez Rebel.ca; leurs nameservers pointent vers Cloudflare et
  il reste à les brancher sur le projet Pages.

## Suivi

Le projet est piloté dans Notion, sous « Faire un site web pour Mariane » dans
le Projects Hub de Nicolas.
