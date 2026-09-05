# Vérifier

La règle unique : **on ne livre rien qu'on n'a pas vu tourner dans un
navigateur.** Lire le code ne prouve rien. Les bugs de ce genre de support
vivent pendant l'animation, entre deux états stables.

Les commandes ci-dessous utilisent le skill `browse` de gstack (`$B`). N'importe
quel pilote de navigateur sans interface fait l'affaire.

## Servir en local

Ouvrir en `file://` suffit pour regarder. Pour tout ce qui est mesuré, servir en
HTTP : le cache de `file://` et l'absence de requêtes par plage faussent les
tests de son et de saut.

```sh
cd mon-support && python3 -m http.server 8790
```

## Le tour de contrôle, à chaque livraison

```sh
$B goto "http://127.0.0.1:8790/index.html"
$B viewport 1600x900
$B js "JSON.stringify(Lecteur.ou())"          # on est bien sur le premier écran
$B console --errors                            # aucune erreur
$B js "Array.prototype.filter.call(document.images,function(i){return i.complete&&i.naturalWidth===0}).length"
```

La dernière ligne compte les images cassées. Elle vaut zéro ou on ne livre pas.
Une image qui manque en local manquera en ligne, et l'inverse arrive aussi :
un script de déploiement qui ne synchronise pas les `.avif`, par exemple.

## Parcourir tous les écrans

```sh
$B js "(function(){var o=[];Lecteur.ecrans.forEach(function(id,i){Lecteur.va(i);\
o.push(id+':'+document.querySelector('.ecran.est-actif').id)});return o.join(' ')})()"
```

Un écran déclaré dans `data.js` sans `<section>` correspondante est signalé au
chargement dans la console. Ne pas ignorer cet avertissement.

## Le piège des captures au repos

Une capture prise après trois secondes montre l'état final. Elle ne montre pas
que le graphique s'est affiché en entier avant de s'animer, ni que deux éléments
se sont chevauchés pendant une demi-seconde.

**Échantillonner à des instants précis :**

```sh
$B js "Lecteur.va(4,1)"
sleep 0.3 ; $B screenshot /tmp/t300.png
sleep 0.3 ; $B screenshot /tmp/t600.png
sleep 0.6 ; $B screenshot /tmp/t1200.png
```

Puis regarder les trois. C'est ainsi qu'on attrape le « il s'affiche, disparaît,
puis s'anime ».

**Ou interroger l'état plutôt que l'image**, ce qui est plus sûr :

```sh
# le tracé doit être replié à l'arrivée, déroulé après
$B js "(function(){Lecteur.va(2,1);var p=document.querySelector('#croissance .courbe-trait');\
return p.style.strokeDashoffset})()"     # attendu : la longueur du tracé
sleep 3
$B js "document.querySelector('#croissance .courbe-trait').style.strokeDashoffset"   # attendu : 0
```

## Tester le retour sur un écran

C'est le test qui trouve la famille de bugs la plus fréquente. Un écran correct à
la première visite peut être cassé à la deuxième, parce que `construit()` ne
rejoue pas.

```sh
$B js "Lecteur.va(2,1)" ; sleep 3          # première visite, l'animation finit
$B js "Lecteur.va(3,1)" ; sleep 1          # on part ailleurs
$B js "(function(){Lecteur.va(2,1);return document.querySelector('#croissance .courbe-trait').style.strokeDashoffset})()"
```

La dernière valeur doit être la longueur du tracé, pas `0`. Si elle vaut `0`,
le repli est dans `construit()` au lieu de `entre()`.

## Vérifier ce qui est visible, pas ce qui est déclaré

`element.hidden = true` ne masque rien si une règle CSS pose un `display`. Un
sélecteur d'identifiant l'emporte sur la règle du navigateur.

```sh
$B js "getComputedStyle(document.getElementById('sommaire')).display"   # 'none' attendu
```

Toujours interroger `getComputedStyle`. La propriété `hidden` dit ce qu'on a
demandé, pas ce qui se passe. Correctif : `#sommaire[hidden]{display:none}`.

## Modifier un fichier sans se tromper

Tout script de remplacement doit vérifier son point d'ancrage. Sans cela, un
`replace` qui ne trouve rien échoue en silence et on débogue une modification
qui n'a jamais été écrite.

```python
def patch(chemin, paires):
    s = io.open(chemin, encoding='utf-8').read()
    for avant, apres in paires:
        assert s.count(avant) == 1, (chemin, s.count(avant), avant[:70])
        s = s.replace(avant, apres)
    io.open(chemin, 'w', encoding='utf-8').write(s)
```

L'`assert` sur `count == 1` attrape les deux erreurs : l'ancre absente et l'ancre
ambiguë. Attention aussi aux apostrophes : `'` et `’` ne sont pas le même
caractère, et le texte d'un support en français est plein de `’`.

## Mesurer, et valider la mesure

Quand on compare deux versions, on mesure. Mais **on vérifie d'abord que la
mesure dit quelque chose**, sur un cas dont on connaît la réponse.

Exemple vécu : pour comparer la fluidité de deux vidéos, compter les images
identiques à la précédente. Comparées au bit près, deux images d'un enregistrement
h264 ne sont jamais identiques — le bruit du codec gonflait le score d'une des
deux sources. Correctif : comparer une signature seuillée, puis **vérifier sur un
passage où rien ne bouge** que les deux sources donnent bien 100 % de figé. Une
mesure qui ne passe pas ce contrôle ne sert à rien.

Le même principe vaut partout : niveaux sonores en RMS plutôt qu'à l'oreille,
synchronisation par corrélation plutôt qu'à l'œil, et un cas témoin à chaque
fois.

## Après mise en ligne

Ne jamais conclure sur le local. Refaire le tour de contrôle sur l'URL publique,
après invalidation du cache.

```sh
curl -s https://exemple/support/data.js | grep -E "TEMPO|total:"
$B goto "https://exemple/support/" && $B js "JSON.stringify(Lecteur.ou())"
$B console --errors
```

Un cache de CDN non invalidé sert l'ancienne version pendant des heures, et
personne ne le voit venir.
