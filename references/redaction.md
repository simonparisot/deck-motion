# Ce qu'on met sur un écran

**À lire avant d'écrire la première ligne.** C'est la partie qu'on rate le plus
souvent, et la seule que la salle remarque.

## La règle qui commande toutes les autres

**L'écran ne dit pas ce que l'orateur dit.** Il montre ce que la parole ne sait
pas montrer : une grandeur, une forme, une comparaison, un rapport. Tout ce qui
peut être dit doit être dit, pas écrit.

Un écran qu'on peut lire à voix haute est un écran raté. Si la salle lit, elle
n'écoute pas — et elle lit toujours plus vite que l'orateur ne parle.

## Les contraintes chiffrées

Elles ne sont pas indicatives. Un écran qui les dépasse doit être scindé.

| Contrainte | Valeur |
|---|---|
| Idées par écran | **une** |
| Mots visibles, hors chiffre héros | **15 au maximum**, 25 pour un écran de citation |
| Objets visuels par écran | **un** : un chiffre, ou un graphique, ou une image |
| Points d'une liste | **trois au maximum**, et mieux vaut zéro |
| Corps de texte minimum | **24 px** dans le canvas 1600 × 900 |
| Durée d'un écran en salle | 30 à 60 secondes |

Le corps minimum est une contrainte déguisée : **si le texte doit rétrécir pour
tenir, c'est qu'il y en a trop.** On ne réduit jamais la taille, on coupe le
texte.

## La forme d'un écran qui marche

Trois briques, jamais plus :

1. **Une affirmation courte**, en haut. Elle dit la conclusion, pas le sujet.
2. **Un objet visuel**, au centre. Le chiffre, la courbe, la grille.
3. **Une légende**, sous l'objet. Ce que le chiffre veut dire, en une ligne.

```html
<section class="ecran" id="conquete">
  <h2 class="titre a" data-pas="1">Un client sur deux vient du digital.</h2>
  <div class="zone-courbe"></div>
  <p class="legende a" data-pas="2">Semaine 2 à semaine 35</p>
</section>
```

## Les titres

**Le titre porte la conclusion.** « Évolution du nombre de comptes » ne dit rien.
« Le rythme a doublé depuis mars » dit tout, et la courbe le prouve.

Écrire le titre en dernier, une fois le graphique fait : on saura alors ce qu'il
démontre.

Pas de titre de service à l'écran — « Sommaire », « Introduction »,
« Conclusion », « Merci ». La structure passe par les chapitres du sommaire et
par la parole.

## Les chiffres

**Un chiffre héros par écran.** Gros, seul, avec son unité. La légende dit ce
qu'il signifie, pas comment il est calculé.

Trois chiffres côte à côte, c'est déjà un tableau : la salle les compare au lieu
d'écouter. Si les trois comptent, ils méritent trois écrans, ou une révélation
en trois étapes.

**Arrondir.** « 15 948 » est juste, « près de 16 000 » se retient. Garder la
précision pour les notes et pour la question qui viendra.

**Ne jamais afficher un chiffre qu'on ne commente pas.** S'il est à l'écran, la
salle le lit et attend qu'on en parle.

## Les graphiques

**Un graphique, un message.** Si deux choses sont intéressantes dans la même
série, faire deux écrans avec deux mises en avant.

Enlever tout ce qui ne sert pas la démonstration : quadrillage, axe des
ordonnées, valeurs sur chaque barre, légende répétant les couleurs. Ce qui reste
doit se lire en deux secondes.

**Mettre en évidence plutôt que tout montrer.** Griser la série de référence,
colorer celle dont on parle. Les étapes servent à ça : la courbe entière
d'abord, puis la partie qui compte.

Jamais de camembert à plus de trois parts, jamais deux axes verticaux.

## Le texte

**Pas de listes à puces.** Une liste est un plan, pas un support. Si trois points
comptent vraiment, en faire trois étapes qui apparaissent au fil de la parole —
la salle suit alors le discours au lieu de lire en avance.

**Pas de phrase complète en corps de texte.** Une affirmation courte, sans verbe
si possible. La grammaire est du côté de l'orateur.

**Pas de source à l'écran.** Elle va dans les notes. On la donne à l'oral si la
question vient.

**Pas de logo sur chaque écran**, pas de numéro de page, pas de bandeau. Ils
mangent l'attention et n'apportent rien.

## Le rythme sur 40 minutes

**Alterner les densités.** Un écran chargé — un graphique commenté — se paie par
deux écrans respirants : un chiffre seul, une affirmation seule. Une suite de
graphiques épuise la salle en dix minutes.

**Un écran de chapitre entre les parties.** Un titre seul sur fond plein. Il ne
dit rien de neuf, il donne le repère que la barre de progression ne donne pas, et
il laisse à l'orateur le temps de changer de sujet.

**Finir sur une image, pas sur un tableau récapitulatif.** Le dernier écran reste
affiché pendant les questions ; qu'il porte le message, pas le sommaire de ce
qu'on vient de dire.

## Vérifier

`outils/audit.mjs` mesure ces contraintes sur un support réel : mots visibles par
écran, nombre de blocs de texte, plus petit corps rendu, débordement hors du
canvas.

```sh
node outils/audit.mjs http://127.0.0.1:8790/index.html
```

Il ne remplace pas le jugement — un écran de citation dépasse légitimement les
15 mots. Mais un support dont la moitié des écrans sont signalés est un support
qu'on va lire au lieu de l'écouter.
