"""Trouve le décalage entre un enregistrement d'écran et un rendu de référence.

Les deux montrent la même chose : on corrèle leurs courbes de luminance.
Le rendu de référence, lui, démarre à l'image zéro par construction.
"""
import subprocess, sys
import numpy as np

capture, reference, ips = sys.argv[1], sys.argv[2], 50

def luminance(f):
    out = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', f, '-vf', f'fps={ips},scale=1:1',
         '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
        capture_output=True).stdout
    return np.frombuffer(out, dtype=np.uint8).astype(float)

a, b = luminance(capture), luminance(reference)
a -= a.mean(); b -= b.mean()
n = min(len(a), len(b))
if n < ips * 5:
    raise SystemExit('séquences trop courtes pour se caler')

best = None
for d in range(-3 * ips, 3 * ips + 1):
    if d >= 0: x, y = a[d:d + n - abs(d)], b[:n - abs(d)]
    else:      x, y = a[:n - abs(d)], b[-d:-d + n - abs(d)]
    c = float(np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y) + 1e-9))
    if best is None or c > best[1]: best = (d, c)

decalage, correlation = best[0] / ips, best[1]
if correlation < 0.9:
    print(f'# corrélation faible ({correlation:.3f}), calage peu sûr', file=sys.stderr)
print(f'{-decalage:.3f} {correlation:.4f}')
