# Un support de plénière, 30 à 45 minutes

Ce n'est pas une vidéo longue. Le rythme vient de l'orateur, pas du chrono.
Trois choses changent.

## 1. Le mode

```js
var MODE = 'presentateur';
var DUREE_VISEE = 40;          // minutes, pour le minuteur
var NOTES_AU_DEPART = false;   // true pour répéter
```

`duree` dans chaque écran devient décoratif : il ne sert qu'au mode auto. On le
renseigne quand même si on compte exporter une vidéo un jour.

## 2. Les commandes en salle

| Touche | Effet |
|---|---|
| `→` `espace` `entrée` | Étape suivante, puis écran suivant |
| `←` `retour arrière` | Étape précédente, puis écran précédent |
| `N` | Notes de l'orateur |
| `S` | Sommaire par chapitres |
| `B` ou `.` | **Écran noir** — pour reprendre la parole |
| `F` | Plein écran |
| `R` | Recommencer, minuteur remis à zéro |
| `Début` `Fin` | Premier, dernier écran |

Un clic n'importe où avance aussi. Une télécommande de présentation envoie
`PageUp` / `PageDown` : c'est câblé.

**L'écran noir est la commande la plus utile** et celle qu'on oublie de prévoir.
Quand une question arrive, on veut que la salle regarde l'orateur, pas la slide.

## 3. Le découpage

**Un écran par idée, une étape par phrase.** Un écran qui demande quatre clics
est un écran qui tient quatre phrases. C'est le bon grain : au-delà, on scinde.

**Des chapitres.** Sur 45 minutes, le sommaire sans chapitres est inutilisable.
Le champ `chapitre` les regroupe, et un écran de chapitre — un titre seul sur
fond plein — donne à la salle le repère que la barre de progression ne donne pas.

**Compter en écrans, pas en minutes.** Un écran de plénière tient entre 30 et
60 secondes. Pour 40 minutes, viser 45 à 70 écrans. En dessous de 30, le support
traîne et l'orateur parle sur une image fixe.

**Écrire les notes en même temps que l'écran**, pas après. Une note utile dit ce
que l'écran ne dit pas : la source d'un chiffre, la question qui vient toujours,
la phrase de transition. Elle ne répète jamais ce qui est affiché.

## Répéter

Ouvrir avec `NOTES_AU_DEPART = true`, lancer, et regarder le minuteur. Il passe
en rouge au dépassement de `DUREE_VISEE`.

Le panneau de notes affiche la position (`12 / 58`), l'étape en cours
(`étape 2 / 4`) et le titre de l'écran suivant. C'est ce qu'il faut pour savoir
où on en est sans regarder ailleurs.

## Deux écrans, portable et projecteur

Le panneau de notes est dans la même fenêtre : il s'affiche donc aussi sur le
projecteur. Trois façons de faire, dans l'ordre de robustesse :

1. **Notes sur papier**, support en plein écran. Ça ne tombe jamais en panne.
2. **Écran étendu** : le support en plein écran sur le projecteur, une seconde
   fenêtre du même fichier sur le portable, avancée en parallèle. Rustique mais
   sans code.
3. **Vraie vue présentateur** : ouvrir une seconde fenêtre et synchroniser par
   `BroadcastChannel`. Ne fonctionne **que servi en `http://`** — deux fenêtres
   `file://` ont des origines opaques et ne communiquent pas. Si on l'ajoute,
   prévoir le repli sur le panneau intégré.

Le choix 1 reste le bon par défaut. Un dispositif de plénière doit survivre à une
salle où rien ne marche.

## Avant d'entrer en salle

- Ouvrir en `file://` sur **le poste qui présentera**, pas sur le sien.
- Passer en plein écran et regarder les bords : la mise à l'échelle doit laisser
  des bandes noires régulières, jamais un écran décalé.
- Parcourir tout le support une fois en `?statique=1` : tous les états finaux
  s'affichent d'un coup, une valeur vide ou un texte qui déborde saute aux yeux.
- Vérifier le premier et le dernier écran en conditions réelles de projection :
  les gris foncés qui passent sur un portable disparaissent sur un projecteur mal
  réglé.
