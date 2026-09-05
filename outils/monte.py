"""Assemble les images du screencast en liste de concaténation ffmpeg.

Le screencast ne rend pas les images à cadence fixe : chacune porte son
horodatage. On écrit donc les durées réelles, ffmpeg ramènera le tout
à une cadence constante.
"""
import json, os, sys

dossier, sortie, ips = sys.argv[1], sys.argv[2], float(sys.argv[3])
d = json.load(open(os.path.join(dossier, 'images.json')))
depart, duree = d['depart'], d['duree']
fin = depart + duree

# On garde la dernière image d'avant le départ : elle couvre l'instant zéro.
imgs = d['images']
debut = 0
for i, im in enumerate(imgs):
    if im['t'] <= depart:
        debut = i
retenues = [im for im in imgs[debut:] if im['t'] <= fin + 1.0]
if len(retenues) < 2:
    raise SystemExit('pas assez d’images')

lignes = []
for i, im in enumerate(retenues):
    t0 = max(im['t'], depart) - depart
    t1 = (retenues[i + 1]['t'] - depart) if i + 1 < len(retenues) else duree
    t1 = min(t1, duree)
    if t1 <= t0:
        continue
    lignes.append("file '%s'\nduration %.5f" % (im['nom'], t1 - t0))
lignes.append("file '%s'" % retenues[-1]['nom'])

open(sortie, 'w').write('\n'.join(lignes) + '\n')
couverture = sum(float(l.split()[-1]) for l in lignes if l.startswith('file') is False)
print('%d images retenues, %.2f s couverts, cadence moyenne %.1f i/s'
      % (len(retenues), duree, len(retenues) / duree))
