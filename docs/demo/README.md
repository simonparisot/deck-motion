# Séminaire de rentrée 2026 · Sillage

Support de la plénière d'ouverture, une heure. **Entreprise et chiffres
entièrement fictifs** : c'est une démonstration du skill `deck-motion`.

Le point de départ est `sources/brief-seminaire.md`, la page de préparation
écrite par la dirigeante. Tout le support en sort : le déroulé, les chiffres,
les titres, les notes de l'orateur.

```sh
open index.html
```

## En salle

| Touche | Effet |
|---|---|
| `→` `espace` `entrée` | Étape suivante, puis écran suivant |
| `←` | Étape précédente, puis écran précédent |
| `N` | Notes de l'orateur |
| `S` | Sommaire par chapitres |
| `B` ou `.` | Écran noir, pour que la salle regarde l'orateur |
| `F` | Plein écran |
| `R` | Recommencer, minuteur à zéro |

26 écrans, six chapitres, 40 minutes de contenu. Avec la vidéo client de deux
minutes et les cinq minutes de pause, la plénière tient dans les 45 minutes
annoncées, et il reste le quart d'heure de questions.

Peu d'écrans, et peu de chiffres écrits : une vingtaine sur tout le support.
Le brief demandait « un chiffre par idée, pas plus ». Le reste est dans les
notes de l'orateur, et c'est lui qui le dit.

## Où est quoi

- `data.js` : **tout le contenu**. Les chiffres dans `DATA`, le déroulé et les
  notes dans `SLIDES`. C'est le seul fichier à ouvrir pour changer un chiffre.
- `index.html` : une `<section class="slide" id="…">` par écran, même ordre et
  mêmes `id` que `SLIDES`. Aucune valeur en dur : les chiffres arrivent par
  `data-count` (compteur animé) et `data-fact` (libellé posé).
- `scenes.js` : les animations. Les briques dessinées ici sont l'histogramme
  mensuel, les barres, l'anneau de mix, les compteurs, les sauts de valeur,
  la **carte de France à bulles** et le **diagramme de Sankey** du tunnel de
  souscription. Aucune dépendance : la carte est un contour d'une quarantaine
  de points projeté en équirectangulaire, le Sankey des courbes de Bézier dont
  les largeurs sont proportionnelles aux volumes.
- `styles.css` : la charte. Trois couleurs, trois sens, jamais autre chose :
  menthe `--key` = nous, ambre `--accent` = le contexte et l'argent qu'on
  emprunte, corail `--alert` = le risque.
- `sources/brief-seminaire.md` : le brief d'origine.

## Ce qui a été vérifié

Dans un vrai navigateur, pas en lisant le code :

- 26 écrans déclarés, 26 présents, même ordre, aucune erreur console.
- Aucun débordement hors du cadre 1600 × 900, sur les 26 écrans.
- Aucun `data-count` ni `data-fact` laissé vide.
- Retour sur un écran déjà visité : compteurs, barres, anneau et courbe
  repartent de zéro avant de rejouer.
- Audit de charge (`~/.claude/skills/deck-motion/tools/audit.sh`) : aucun corps
  de texte sous 24 px.

## Les écrans volontairement denses

L'audit les signale, c'est normal.

L'outil compte les mots visibles. Sur un graphique, les étiquettes d'axe et de
nœud en font partie : c'est ce qui explique l'essentiel des signalements.

- `production`, `trajectoire`, `taux` : les étiquettes sont un axe, pas du
  texte à lire.
- `sankey` : quatre noms d'étape et trois noms de perte. Sans eux le diagramme
  ne veut rien dire.
- `promesse`, `paris`, `squads`, `non-choix`, `concurrence` : des points
  révélés au clic, au fil de la parole. C'est le bon usage des étapes, pas une
  liste à puces.
- `equation` : les cinq termes doivent être vus ensemble, c'est tout le propos
  du chapitre.

Aucun corps de texte n'est sous 24 px, et c'est la limite qui compte vraiment
en salle.

## Répéter

Mettre `NOTES_AT_START = true` dans `data.js`, lancer, et regarder le minuteur
en bas à droite. Il passe en rouge au-delà de `TARGET_MINUTES`, réglé à 60.

Parcourir une fois avec `index.html?static=1` : tous les états finaux
s'affichent d'un coup, sans animation. Une valeur vide ou un texte qui déborde
saute aux yeux.

`MODE = 'auto'` dans `data.js` fait dérouler le support tout seul, pour un
écran d'accueil ou pour en tirer une vidéo.
