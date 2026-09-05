# Support de présentation

Support autonome, sans dépendance ni build. Double-cliquer sur `index.html`.

## Commandes

| Touche | Effet |
|---|---|
| `→` `espace` ou clic | Étape suivante, puis écran suivant |
| `←` `retour arrière` | Étape précédente, puis écran précédent |
| `N` | Notes de l'orateur |
| `S` | Sommaire |
| `B` ou `.` | Écran noir |
| `F` | Plein écran |
| `R` | Recommencer |

## Changer le contenu

**Tout est dans `data.js`.** C'est le seul fichier à ouvrir.

- **Un chiffre** → sa valeur dans `DATA`. L'écran, le compteur et le graphique suivent.
- **Le déroulé** → le tableau `ECRANS` : ordre, titres, chapitres, notes.
- **Le nombre d'étapes d'un écran** → la longueur de son tableau `pas`.
- **Le rythme d'ensemble** → `TEMPO`. 1.3 ralentit de 30 %.
- **Passer en vidéo** → `MODE = 'auto'`.

## URL spéciales

| URL | Effet |
|---|---|
| `index.html` | Lecture normale |
| `index.html?statique=1` | Sans animation, chaque écran dans son état final |

## Codage couleur

À écrire ici et à ne plus changer : une couleur, un sens, sur tout le support.

| Couleur | Signification |
|---|---|
| `--vif` | Le sujet, les chiffres héros |
| `--appui` | Données secondaires |
| `--tension` | Alerte, comparaison défavorable |
