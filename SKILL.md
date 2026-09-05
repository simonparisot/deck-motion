---
name: deck-motion
description: |
  Construire une présentation web animée qui se contrôle comme des slides : canvas fixe
  mis à l'échelle, écrans en HTML/CSS/JS sans dépendance, animations par étapes déclenchées
  au clic ou au chrono, notes de l'orateur, sommaire, minuteur. Pensé pour une plénière de
  30 à 45 minutes comme pour une vidéo de trois minutes. Contient un modèle qui fonctionne,
  la méthode de vérification en navigateur, l'export vidéo avec bande son et la mise en
  ligne. À utiliser quand on demande un support de présentation « pas un PowerPoint », un
  motion design web, un slideshow animé, ou l'export vidéo d'un tel support.
---

# Présentation web animée

Le but : un support qui a la tenue d'un motion design et la souplesse de slides.
Pas de dépendance, pas de build, un fichier à ouvrir. On le pilote au clavier
pendant une plénière, ou on le laisse dérouler seul pour en faire une vidéo.

> **Avant d'écrire quoi que ce soit, lire `references/redaction.md`.**
> Un support de présentation orale est **très peu chargé** : une idée par écran,
> quinze mots au maximum, un seul objet visuel, pas de liste à puces. L'écran ne
> dit pas ce que l'orateur dit — il montre ce que la parole ne sait pas montrer.
> C'est la contrainte qu'on relâche en premier et qui se voit le plus en salle.
> `outils/audit.sh` la mesure, écran par écran.

## Commencer

```sh
cp -r <ce-skill>/modele mon-support && cd mon-support
open index.html
```

Le modèle fonctionne tel quel : cinq écrans, un compteur, une courbe, une grille
de points, les notes de l'orateur et le sommaire. Il sert de socle, pas d'exemple
à recopier : on remplace le contenu, on garde le moteur.

**Tout le contenu est dans `data.js`.** C'est le seul fichier qu'une personne non
technique doit ouvrir. Les chiffres, le déroulé, les notes, le rythme.

## Les quatre décisions qui tiennent tout le reste

**Un canvas fixe de 1600 × 900, mis à l'échelle par le JavaScript.** Rien ne se
recompose : la mise en page est rigoureusement identique sur un portable, un
vidéoprojecteur et un écran d'accueil. On dessine une fois, à une seule taille.
C'est ce qui permet de placer les choses au pixel sans jamais tester dix largeurs.

**Des scripts classiques, pas de modules ES.** C'est ce qui permet d'ouvrir le
fichier en `file://` d'un double-clic, sans serveur. Sur le poste d'un orateur
qui n'a ni Node ni réseau, ça compte.

**Un seul fichier de contenu.** `data.js` porte les chiffres, le déroulé et les
notes. Aucune valeur en dur dans le HTML : sinon deux chiffres divergent et
personne ne s'en aperçoit avant la salle.

**Des étapes, pas un minutage.** Chaque écran déclare ses étapes. En mode
présentateur elles avancent au clic, en mode auto elles suivent un chrono. Le
même code d'écran sert aux deux. C'est ce qui rend le support réutilisable en
vidéo sans le réécrire.

## Le fil de travail

1. **Écrire le déroulé dans `data.js`** avant toute ligne de CSS : les écrans,
   les chapitres, le nombre d'étapes, les notes. Le contenu d'abord.
   Ce qui se dit va dans les notes, ce qui se montre va sur l'écran.
2. **Poser les écrans en HTML**, un `<section class="ecran" id="…">` par entrée.
   Trois briques par écran : une affirmation courte, un objet visuel, une légende.
3. **Animer par étapes.** Un élément porte `class="a" data-pas="2"` : il apparaît
   à l'étape 2. Pour ce que le CSS ne sait pas faire, un hook `pas(s, n)`.
4. **Passer l'audit de charge** : `outils/audit.sh`. Un écran signalé se scinde,
   il ne se rétrécit pas.
5. **Vérifier en navigateur, jamais en lisant le code.** Voir
   `references/verification.md`. C'est la partie qu'on saute et qu'on regrette.
6. **Exporter si besoin** : vidéo, bande son, mise en ligne. Voir
   `references/export.md`.

## Les références

| Fichier | Quand le lire |
|---|---|
| `references/redaction.md` | **En premier.** Ce qu'on met sur un écran, et ce qu'on n'y met pas |
| `references/architecture.md` | Comprendre le moteur avant de le modifier |
| `references/scenes.md` | Écrire un écran, animer, les pièges de dessin |
| `references/pleniere.md` | Un support de 30 à 45 minutes, mode présentateur |
| `references/verification.md` | **Avant de livrer quoi que ce soit** |
| `references/export.md` | Vidéo, musique, mise en ligne S3 + CloudFront |

## Ce qui coûte cher quand on l'ignore

Ces cinq points viennent tous d'un bug réel, trouvé tard.

**Un élément animé doit être caché dans `entre()`, pas dans `construit()`.**
`construit()` ne tourne qu'une fois. Au retour sur l'écran, l'élément est resté
dans son état final et s'affiche en entier avant de se réanimer. Le symptôme
classique : « le graphique apparaît d'un coup, disparaît, puis s'anime ».

**`[hidden]` ne masque rien si la règle CSS pose un `display`.** `#truc{display:flex}`
gagne sur la règle du navigateur. Il faut écrire `#truc[hidden]{display:none}`.
Vérifier avec `getComputedStyle`, pas avec la propriété `hidden`.

**Une capture d'écran au repos ne prouve rien.** Les bugs vivent pendant
l'animation. Il faut échantillonner des images à des instants précis.

**Tout script qui modifie un fichier doit vérifier son point d'ancrage.** Un
`replace` qui ne trouve rien échoue en silence et on débogue une modification
qui n'a jamais été écrite.

**Un support dense passe inaperçu à l'écriture et se paie en salle.** L'agent qui
rédige a tendance à remplir : trois chiffres au lieu d'un, une liste au lieu d'une
phrase, la source sous le graphique. Passer `outils/audit.sh` avant de livrer, et
scinder les écrans signalés plutôt que réduire le corps de texte.

**Mesurer plutôt que juger à l'œil.** Le son se mesure en RMS, la synchronisation
par corrélation, la fluidité en comptant les images figées. Et on valide la mesure
elle-même sur un cas connu avant de lui faire confiance.
