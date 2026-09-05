# deck-motion

Un skill [Claude Code](https://claude.com/claude-code) pour construire des
présentations web animées qui se contrôlent comme des slides.

*A Claude Code skill for building animated web presentations that behave like
slides: fixed scaled canvas, no dependencies, step-based animations driven by
click or clock, speaker notes, and video export. Documentation in French.*

---

Le but : un support qui a la tenue d'un motion design et la souplesse de slides.
Pas de dépendance, pas de build, un fichier à ouvrir. On le pilote au clavier
pendant une plénière de 40 minutes, ou on le laisse dérouler seul pour en faire
une vidéo de trois.

## Installer

```sh
git clone https://github.com/<vous>/deck-motion.git ~/.claude/skills/deck-motion
```

C'est tout. Le skill se charge de lui-même quand la demande s'y prête, ou à
l'appel de `/deck-motion`.

## Essayer sans Claude

Le modèle est autonome :

```sh
cp -r ~/.claude/skills/deck-motion/modele ma-pleniere
cd ma-pleniere && open index.html
```

`→` avance d'une étape puis d'un écran, `N` ouvre les notes de l'orateur,
`S` le sommaire, `B` l'écran noir, `F` le plein écran.

## Ce qu'il y a dedans

| | |
|---|---|
| `modele/` | Un support qui fonctionne, à copier et remplir. Tout le contenu tient dans `data.js`. |
| `references/redaction.md` | **À lire en premier.** Ce qu'on met sur un écran de présentation orale, et ce qu'on n'y met pas. |
| `references/architecture.md` | Le canvas fixe, le cycle de vie d'un écran, les deux modes, le tempo. |
| `references/scenes.md` | Écrire un écran, les outils de dessin, les pièges SVG. |
| `references/pleniere.md` | Un support de 30 à 45 minutes : découpage, notes, double écran. |
| `references/verification.md` | La méthode de vérification en navigateur. |
| `references/export.md` | Vidéo, bande son calée sur les mesures, mise en ligne. |
| `outils/` | Audit de charge, capture vidéo, montage du son, calage automatique. |

## Le parti pris

**Très peu chargé.** Une idée par écran, quinze mots au maximum, un seul objet
visuel, pas de liste à puces. L'écran ne dit pas ce que l'orateur dit : il montre
ce que la parole ne sait pas montrer. `outils/audit.sh` mesure cette contrainte
écran par écran plutôt que de la laisser à l'appréciation.

**Un canvas fixe de 1600 × 900**, mis à l'échelle par le JavaScript. Rien ne se
recompose : la mise en page est identique du portable au vidéoprojecteur, et on
ne teste qu'une seule largeur.

**Des scripts classiques, pas de modules.** Le fichier s'ouvre d'un double-clic,
sans serveur, sur le poste d'un orateur qui n'a ni Node ni réseau.

**Des étapes, pas un minutage.** Le même code d'écran sert à la plénière et à la
vidéo. Un support devient une vidéo sans réécriture.

## Prérequis

Aucun pour écrire et présenter : le support est du HTML, du CSS et du JavaScript
classique.

Pour les outils d'audit et d'export : `node`, `ffmpeg`, `python3`, et un Chromium
du cache Playwright (`npx playwright install chromium`). Les chemins sont prévus
pour macOS et Linux ; posez `CHROMIUM=/chemin/vers/chrome` ailleurs.

## Origine

Ce skill est l'extraction d'un projet réel : une présentation de trois minutes
diffusée à 17 000 personnes, puis retravaillée en support de plénière. Les
chiffres cités dans les références — les taux d'images figées entre méthodes de
capture, les seuils de compression, les corrélations de calage — sont des mesures
faites sur ce projet, pas des estimations.

## Licence

MIT. Voir `LICENSE`.
