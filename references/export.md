# Exporter : vidéo, musique, mise en ligne

## Passer le support en mode vidéo

```js
var MODE = 'auto';
var TEMPO = 1.6;      // le confort de lecture en salle n'est pas celui d'une vidéo
```

En mode auto, `duree` et les délais de `pas` reprennent leur sens. Un support de
plénière converti tel quel défile trop vite : les étapes étaient calées sur la
parole d'un orateur, pas sur la lecture d'un spectateur. Compter large.

Ajouter un **écran de lancement** dès qu'il y a du son : les navigateurs
interdisent de démarrer un son sans geste de l'utilisateur, aucune page web n'y
échappe. Un bouton qui lance l'image et le son ensemble règle le problème et
garantit que le montage sonore est calé dès la première image.

## Fabriquer la vidéo

**Le meilleur résultat vient d'un enregistrement d'écran.** Mesuré sur un
compteur qui défile, part d'images identiques à la précédente à 50 i/s :

| Méthode | Images figées |
|---|---|
| Enregistrement d'écran | **19 %** |
| Capture pilotée par l'horloge du navigateur | 57 % |
| Capture par screencast | 72 % |

La raison : un enregistrement d'écran suit le rythme de l'affichage. Une capture
pilotée depuis le navigateur renvoie des images que le compositeur n'a pas fini de
composer. La commande qui forcerait une image composée par pas,
`HeadlessExperimental.beginFrame`, a été retirée de Chromium ; `fromSurface:false`
est pire encore. Le pilotage de l'horloge virtuelle fonctionne bien par ailleurs
— le `requestAnimationFrame` tourne à 154 Hz virtuels — mais ne suffit pas.

Donc : **enregistrer l'écran, puis monter le son dessus.**

```sh
outils/mux-capture.sh enregistrement.mov
```

Le script trouve le calage tout seul : il rend 40 s de référence, dont il connaît
l'image zéro par construction, et corrèle les courbes de luminance des deux
sources. Sur des cas réels il retrouve le décalage à 20 ms près, avec une
corrélation de 0,98 à 0,99. Il gère les deux sens — enregistrement démarré avant
ou après la première image.

`outils/build-video.sh` rend une vidéo sans passer par l'écran. Pratique pour
vérifier, moins bon pour diffuser. `HORLOGE=1` active l'horloge pilotée.

## Réglages d'encodage

Réduire une capture Retina en 1920 × 1080 avec un filtre Lanczos : c'est un
sous-échantillonnage, l'image y gagne en netteté. Garder 60 images par seconde
pour ne rien jeter des animations rapides.

| Réglage | Résultat sur 3 minutes |
|---|---|
| `crf 16` | ~45 Mo, la version à diffuser |
| `crf 18` | ~30 Mo, pour partager |
| `crf 20` | ~26 Mo, visiblement plus mou sur les aplats sombres |

Les aplats sombres et les grilles de points fins sont ce qui souffre le plus.
Comparer deux encodages en extrayant le **même instant** des deux et en regardant
le détail à l'échelle 1:1 — pas la vidéo entière à l'œil.

## La musique

`outils/build-musique.sh` monte un morceau sur la durée exacte du support. Le
principe, si on doit le refaire à la main :

**Repérer le tempo du morceau**, puis ne faire que des sauts d'un **nombre entier
de mesures**. La pulsation reste alors continue et le raccord ne s'entend pas.
Un morceau à 146,32 BPM a une mesure de 1,6402 s ; tous les sauts sont des
multiples de cette valeur.

**Choisir les points de raccord sur des niveaux voisins.** Mesurer le RMS de part
et d'autre : un écart d'un décibel passe inaperçu, quatre s'entendent. Un
fondu enchaîné de 1,2 s en puissance constante (`acrossfade=c1=qsin:c2=qsin`)
suffit.

**Caler les moments forts sur le récit.** L'entrée du beat doit tomber sur
l'écran qui révèle le sujet, la coda sur la conclusion. Si l'entrée arrive trop
tôt, reboucler quelques mesures dans l'intro calme plutôt que d'ajouter du
silence : c'est inaudible et ça décale tout ce qui suit.

**Faire calculer les points par le script, pas à la main.** `build-musique.sh`
lit les durées dans `data.js` : un changement de tempo ne demande qu'un
relancement. Un montage calé en dur se désaccorde au premier ajustement.

## Mettre en ligne

S3 privé plus CloudFront, un dossier par version :

```sh
aws s3 sync ./support s3://bucket/dossier --delete \
  --exclude "*" --include "*.html" --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=60, must-revalidate"
# puis un sync par type, et enfin :
aws cloudfront create-invalidation --distribution-id XXX --paths "/dossier/*"
```

Trois choses qui coûtent quand on les oublie :

- **Synchroniser tous les types.** Un script qui ne liste que html, js et css
  laisse les `.avif`, `.mp3` et `.jpg` en 403. On ne le voit qu'en production.
- **Poser le bon `Content-Type`.** `aws s3 sync` en devine certains mal ; un
  `.mp3` servi en `binary/octet-stream` ne se lit pas.
- **Attendre la fin de l'invalidation** avant de vérifier, sinon on contrôle
  l'ancienne version et on conclut à tort.

Chaque synchronisation avec `--delete` efface ce que le dossier contenait. Pour
garder une version, la déployer dans un autre dossier plutôt que d'espérer s'en
souvenir.
