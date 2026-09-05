"""Finds the offset between a screen recording and a reference render.

Both show the same thing, so their luminance curves are correlated. The
reference render starts on frame zero by construction, which is what makes
the offset meaningful.
"""
import subprocess, sys
import numpy as np

recording, reference, fps = sys.argv[1], sys.argv[2], 50

def luminance(f):
    out = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', f, '-vf', f'fps={fps},scale=1:1',
         '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
        capture_output=True).stdout
    return np.frombuffer(out, dtype=np.uint8).astype(float)

a, b = luminance(recording), luminance(reference)
a -= a.mean(); b -= b.mean()
n = min(len(a), len(b))
if n < fps * 5:
    raise SystemExit('sequences too short to correlate')

best = None
for d in range(-3 * fps, 3 * fps + 1):
    if d >= 0: x, y = a[d:d + n - abs(d)], b[:n - abs(d)]
    else:      x, y = a[:n - abs(d)], b[-d:-d + n - abs(d)]
    c = float(np.dot(x, y) / (np.linalg.norm(x) * np.linalg.norm(y) + 1e-9))
    if best is None or c > best[1]: best = (d, c)

offset, correlation = best[0] / fps, best[1]
if correlation < 0.9:
    print(f'# weak correlation ({correlation:.3f}), offset is unreliable', file=sys.stderr)
print(f'{-offset:.3f} {correlation:.4f}')
