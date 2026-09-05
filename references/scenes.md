# Écrire un écran

## Le minimum

Dans `data.js` :

```js
{ id: 'passerelle', titre: 'La passerelle', chapitre: 'Le constat',
  pas: [400, 1600], duree: 12,
  notes: 'Insister sur le fait que ces clients nous connaissaient déjà.' }
```

Dans `index.html` :

```html
<section class="ecran" id="passerelle">
  <h2 class="titre a" data-pas="1">Ils nous connaissaient déjà.</h2>
  <p class="sous-titre a" data-pas="2">Sept sur dix étaient clients particuliers.</p>
</section>
```

C'est tout. Pas de hook : la classe `a` plus `data-pas="N"` suffit à faire
apparaître un élément à l'étape N.

## Quand il faut un hook

Dès qu'il faut dessiner ou compter.

```js
HOOKS.passerelle = {
  construit: function (s) {
    this.trace = courbe(q('.zone-courbe', s), DATA.serie);
  },
  entre: function (s) {
    cachePath(this.trace);                       /* replie le tracé */
    q('[data-compteur]', s).textContent = '';    /* vide le compteur */
  },
  pas: function (s, n, direct) {
    if (n === 1) tracePath(this.trace, 1600);
    if (n === 2) compteJusqua(q('[data-compteur]', s), 7000, direct ? 0 : 900, '', 'fr');
  }
};
```

Trois règles :

1. **Ce qui coûte va dans `construit()`**, il ne tourne qu'une fois.
2. **Ce qui doit repartir de zéro va dans `entre()`**, il tourne à chaque arrivée.
3. **`direct` vaut `true` en marche arrière** : poser la valeur finale, ne pas
   réanimer.

## Les outils fournis

| Outil | Ce qu'il fait |
|---|---|
| `compteJusqua(node, cible, duree, suffixe, format)` | Compteur animé, décélère sur la fin. `format:'fr'` sépare les milliers |
| `courbe(hote, serie, options)` | Courbe pleine largeur avec aire dégradée, rend le tracé |
| `cachePath(path)` / `tracePath(path, duree)` | Replie puis déroule un tracé SVG |
| `grillePoints(hote, n, colonnes)` | Grille de points, rend le tableau |
| `allumeRatio(points, ratio, classe)` | Allume une part au hasard, par vagues |
| `nbsp(n)` | Espace fine insécable tous les trois chiffres |
| `svgEl(tag, attrs)` | Crée un élément SVG avec ses attributs |

## Les pièges de dessin

**Le tracé qui s'affiche avant de s'animer.** Un `<path>` SVG avec un attribut
`d` est dessiné en entier dès sa création. Il faut poser `stroke-dasharray` et
`stroke-dashoffset` **dans `entre()`**. Le faire dans `construit()` marche à la
première visite et échoue à toutes les suivantes.

**`preserveAspectRatio="none"` déforme le texte.** Il étire le SVG sur les deux
axes indépendamment. Si le conteneur n'a pas exactement la hauteur du `viewBox`,
les lettres s'allongent. Donner au conteneur une hauteur fixe égale à celle du
`viewBox`, ou renoncer à `none`.

**`getTotalLength()` peut rendre 0** sur un élément pas encore rendu. Toujours
écrire `path.getTotalLength() || 3000` : la valeur de repli doit dépasser la
longueur réelle, ce qui cache le tracé au lieu de le montrer.

**Un compteur qui démarre à `0`** donne l'impression que la page est bloquée.
Vider le texte dans `entre()` et lancer le compteur avec un court délai.

**Un nombre qui grandit fait sauter la phrase** qui l'entoure. Lui donner un
`display:inline-block` et un `min-width` calculé sur la valeur finale.

**Une animation `infinite` scintille** quand l'écran est rejoué. Préférer une
animation unique avec un décalage par élément.

## Les couleurs

Le modèle expose quatre jetons : `--vif` pour le sujet et les chiffres héros,
`--appui` pour les données secondaires, `--tension` pour ce qui alerte, et les
niveaux d'encre.

Deux règles apprises en salle :

**Une couleur, un sens, sur tout le support.** Si le vif désigne le produit,
il ne désigne jamais autre chose. On l'écrit dans le README du support, sinon
la troisième personne qui touche au fichier le casse.

**Deux teintes voisines sont indiscernables au vidéoprojecteur.** Un jaune et
un vert acide côte à côte dans un graphique empilé sont illisibles à dix mètres.
Il faut un écart de teinte franc, pas un écart de luminosité.

## L'échelle d'un long support

Pour 40 à 80 écrans, `index.html` devient long mais reste lisible : une section
par écran, dans l'ordre du sommaire, avec un commentaire de séparation. Le
moteur ne construit un écran qu'à sa première visite, la taille du fichier ne
coûte donc rien au démarrage.

Si le fichier devient vraiment ingérable, découper par chapitre et concaténer à
la main plutôt que d'introduire un build : la valeur du dispositif tient au fait
qu'il n'y a rien à installer.
