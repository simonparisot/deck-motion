"""Turns screencast frames into an ffmpeg concat list.

The screencast does not emit frames at a fixed rate: each one carries its own
timestamp. So we write the real durations and let ffmpeg resample to a
constant frame rate.
"""
import json, os, sys

folder, out, fps = sys.argv[1], sys.argv[2], float(sys.argv[3])
d = json.load(open(os.path.join(folder, 'frames.json')))
start, length = d['start'], d['length']
end = start + length

frames = d['frames']
first = 0
for i, f in enumerate(frames):
    if f['t'] <= start:
        first = i
kept = [f for f in frames[first:] if f['t'] <= end + 1.0]
if len(kept) < 2:
    raise SystemExit('not enough frames')

lines = []
for i, f in enumerate(kept):
    t0 = max(f['t'], start) - start
    t1 = (kept[i + 1]['t'] - start) if i + 1 < len(kept) else length
    t1 = min(t1, length)
    if t1 <= t0:
        continue
    lines.append("file '%s'\nduration %.5f" % (f['name'], t1 - t0))
lines.append("file '%s'" % kept[-1]['name'])

open(out, 'w').write('\n'.join(lines) + '\n')
print('%d frames kept, %.2f s covered, %.1f fps on average'
      % (len(kept), length, len(kept) / length))
