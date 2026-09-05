# Verifying

One rule: **never ship anything you have not watched run in a browser.** Reading
the code proves nothing. The bugs in this kind of deck live during the animation,
between two stable states.

The commands below use any headless browser driver. `$B` stands for it.

## Serve locally

Opening from `file://` is fine to look at. For anything measured, serve over
HTTP: the `file://` cache and the lack of range requests skew sound and seek
tests.

```sh
cd my-deck && python3 -m http.server 8790
```

## The check-round, every time you ship

```sh
$B goto "http://127.0.0.1:8790/index.html"
$B viewport 1600x900
$B js "JSON.stringify(Player.where())"        # we are on the first slide
$B console --errors                            # no errors
$B js "Array.prototype.filter.call(document.images,function(i){return i.complete&&i.naturalWidth===0}).length"
```

The last line counts broken images. It reads zero or you do not ship. An image
missing locally will be missing online, and the reverse happens too: a deploy
script that does not sync `.avif`, for instance.

## Walk every slide

```sh
$B js "(function(){var o=[];Player.slides.forEach(function(id,i){Player.go(i);\
o.push(id+':'+document.querySelector('.slide.is-active').id)});return o.join(' ')})()"
```

A slide declared in `data.js` with no matching `<section>` is reported in the
console at load. Do not ignore that warning.

## The trap of screenshots at rest

A screenshot taken after three seconds shows the final state. It does not show
that the chart appeared in full before animating, or that two elements overlapped
for half a second.

**Sample at precise moments:**

```sh
$B js "Player.go(4,1)"
sleep 0.3 ; $B screenshot /tmp/t300.png
sleep 0.3 ; $B screenshot /tmp/t600.png
sleep 0.6 ; $B screenshot /tmp/t1200.png
```

Then look at all three. That is how you catch "it shows, disappears, then
animates".

**Or query the state instead of the picture**, which is safer:

```sh
# the path must be folded on arrival, unrolled after
$B js "(function(){Player.go(2,1);var p=document.querySelector('#growth .curve-line');\
return p.style.strokeDashoffset})()"     # expected: the path length
sleep 3
$B js "document.querySelector('#growth .curve-line').style.strokeDashoffset"   # expected: 0
```

## Test coming back to a slide

This is the test that finds the most common family of bugs. A slide that is fine
on the first visit can be broken on the second, because `build()` does not run
again.

```sh
$B js "Player.go(2,1)" ; sleep 3          # first visit, animation completes
$B js "Player.go(3,1)" ; sleep 1          # we go somewhere else
$B js "(function(){Player.go(2,1);return document.querySelector('#growth .curve-line').style.strokeDashoffset})()"
```

The last value must be the path length, not `0`. If it is `0`, the fold is in
`build()` instead of `enter()`.

## Check what is visible, not what is declared

`element.hidden = true` hides nothing if a CSS rule sets a `display`. An id
selector beats the browser's own rule.

```sh
$B js "getComputedStyle(document.getElementById('toc')).display"   # 'none' expected
```

Always query `getComputedStyle`. The `hidden` property says what you asked for,
not what is happening. The fix: `#toc[hidden]{display:none}`.

## Editing a file without getting it wrong

Every replacement script must assert its anchor. Without that, a `replace` that
matches nothing fails silently and you debug a change that was never written.

```python
def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert s.count(old) == 1, (path, s.count(old), old[:70])
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8').write(s)
```

Asserting `count == 1` catches both failures: the missing anchor and the
ambiguous one. Watch out for apostrophes too: `'` and `’` are not the same
character, and presentation copy is full of `’`.

## Measure, and validate the measurement

When you compare two versions, measure. But **first check the measurement says
something**, on a case whose answer you already know.

A real example, from `tools/audit.sh` itself. The first version measured the
smallest rendered font on a slide and flagged anything under 24 px. Every chart
slide failed — on its axis labels, which are two characters long and which nobody
reads as prose. The measurement was counting the wrong thing, and had it been
trusted it would have pushed every axis label to 24 px and wrecked the charts.

The fix was to define what is being measured: body size only applies to blocks of
three words or more, and numeric labels do not count as words at all. Then the
template, which is meant to be exemplary, passed 5 out of 5.

The lesson generalises: before trusting a measurement, run it on a case whose
answer you already know. A metric that flags something you are sure is fine is
telling you about itself, not about the deck.

## After deploying

Never conclude from the local copy. Run the check-round again on the public URL,
after the cache is invalidated.

```sh
curl -s https://example/deck/data.js | grep -E "TEMPO|total"
$B goto "https://example/deck/" && $B js "JSON.stringify(Player.where())"
$B console --errors
```

A CDN cache that was not invalidated serves the old version for hours, and nobody
sees it coming.
