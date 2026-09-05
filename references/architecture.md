# Le moteur

Trois fichiers, plus le contenu. Aucune dépendance, aucun build.

```
index.html    les <section> d'écran, le chrome, le sommaire
styles.css    jetons de couleur, squelette, styles d'écran
data.js       ← LE SEUL FICHIER DE CONTENU
scenes.js     moteur, outils de dessin, hooks d'écran
app.js        le lecteur : navigation, étapes, notes, minuteur
```

## Le canvas fixe

`#scene` fait 1600 × 900 pixels, toujours. `app.js` calcule un facteur d'échelle
et applique un `transform: scale()`. Tout le reste se mesure en pixels de ce
canvas.

```js
var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
scene.style.transform = 'translate(-50%,-50%) scale(' + k + ')';
```

Le centrage se fait en `position:absolute; left:50%; top:50%` puis
`translate(-50%,-50%)`. **Pas en grid ni en flex** : un enfant de 1600 px dans un
conteneur plus étroit déborde au lieu de se centrer, et l'écran se retrouve
décalé sur les petites fenêtres.

Conséquence pratique : on ne teste qu'une seule largeur. Ce qui est juste à
1600 × 900 est juste partout.

## Le cycle de vie d'un écran

```js
HOOKS.monEcran = {
  construit: function (s) { /* une fois, à la première arrivée */ },
  entre:     function (s) { /* à chaque arrivée : remise à zéro */ },
  pas:       function (s, n, direct) { /* à chaque étape */ },
  sort:      function (s) { /* en quittant */ }
};
```

`construit()` crée le DOM coûteux : SVG, grilles, listes. Il ne tourne qu'une
fois, la construction est mise en cache.

`entre()` **remet l'écran dans son état de départ**. C'est le point le plus
important du moteur. Vider les compteurs, replier les tracés, éteindre les
points. Tout ce qui doit repartir de zéro va ici, jamais dans `construit()`.

`pas(s, n, direct)` reçoit le numéro d'étape. `direct` vaut `true` quand on
revient en arrière : l'écran se rejoue jusqu'à l'étape visée, et les hooks
peuvent alors poser la valeur finale sans réanimer.

Le moteur pose aussi la classe `pas-N` sur la `<section>` à chaque étape. Pour
tout ce que le CSS sait faire, le hook `pas()` est inutile.

## Les étapes

Dans `data.js` :

```js
{ id: 'contexte', titre: 'Le marché', chapitre: 'Introduction',
  pas: [600, 2000, 3400], duree: 18,
  notes: 'Le chiffre clé est le 96 %.' }
```

`pas` est un tableau de délais en millisecondes. Sa **longueur** donne le nombre
d'étapes ; ses **valeurs** ne servent qu'en mode auto. Un écran sans étape
multiple déclare `pas: [400]`.

Arriver sur un écran applique déjà l'étape 1. Un écran ne s'affiche donc jamais
vide en attendant un clic.

## Les deux modes

`var MODE = 'presentateur'` ou `'auto'`, dans `data.js`.

**presentateur** — `→` avance d'une étape, puis passe à l'écran suivant quand
elles sont épuisées. `←` recule d'une étape, puis revient à l'écran précédent sur
sa dernière étape. Pas de chrono.

**auto** — les étapes se déclenchent sur leurs délais, l'écran change après
`duree` secondes. C'est le mode vidéo.

Le même code d'écran sert aux deux. C'est délibéré : un support de plénière doit
pouvoir devenir une vidéo sans réécriture.

## Le tempo

`var TEMPO = 1.4` ralentit tout de 40 % : durées d'écran, délais d'étape,
animations CSS. Il agit par deux chemins :

- en JS, `facteurTempo()` multiplie les `setTimeout` et les durées d'animation ;
- en CSS, `app.js` pose `--tempo` sur `:root`, et les règles écrivent
  `animation-delay: calc(var(--d,0s) * var(--tempo,1))`.

Un délai écrit en dur quelque part échappe au tempo et désynchronise tout le
reste. Il n'y a pas d'exception acceptable.

## Le mouvement réduit

`?statique=1` dans l'URL, ou le réglage système « réduire les animations ».
Chaque écran s'affiche directement dans son état final. Utile pour une diffusion
sur écran d'accueil, pour les personnes sensibles au mouvement, et pour vérifier
d'un coup d'œil que tous les états finaux sont corrects.

Les outils de dessin (`compteJusqua`, `tracePath`, `allumeRatio`) le gèrent déjà.
Une animation écrite à la main doit le gérer aussi.

## Le chrome

Barre de progression cliquable en haut, boutons au survol en bas, minuteur en bas
à droite, sommaire par chapitres, panneau de notes. Tout est en `position:fixed`,
donc hors du canvas mis à l'échelle : le chrome garde sa taille réelle quelle que
soit la fenêtre.
