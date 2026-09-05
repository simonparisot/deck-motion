# Deploying

A deck is a folder of static files. Anything that serves static files will do.
What follows is one arrangement that works, and the three things that bite.

## A private bucket behind a CDN

```sh
aws s3 sync ./deck s3://bucket/folder --delete \
  --exclude "*" --include "*.html" --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=60, must-revalidate"
# then one sync per file type, and finally:
aws cloudfront create-invalidation --distribution-id XXX --paths "/folder/*"
```

**Sync every type.** A script that lists only html, js and css leaves `.avif`,
`.woff2` and images returning 403. You only find out in production, on the
machine of whoever opens it first.

**Set the right `Content-Type`.** `aws s3 sync` guesses some of them badly, and a
font or an image served as `binary/octet-stream` simply does not load.

**Wait for the invalidation to finish** before checking. Otherwise you verify the
old version and conclude wrongly.

Every `--delete` sync wipes what the folder held. To keep a version, deploy it to
another folder rather than hoping to remember.

## Directory URLs

Static hosting rarely serves `index.html` for a URL ending in `/`. On CloudFront,
a small viewer-request function does it:

```js
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    } else if (!uri.includes('.')) {
        request.uri = uri + '/index.html';
    }
    return request;
}
```

If such a function is shared across a whole domain, treat it as shared
infrastructure: one repository owns it, and every project that needs a change
goes through that repository. Two copies always end up diverging, and the second
deploy silently undoes the first.

## Check after deploying, not before

Never conclude from the local copy. Run the check-round from
`verifying.md` again on the public URL, once the cache is invalidated.

```sh
curl -s https://example/deck/data.js | grep -E "TEMPO|SLIDES"
$B goto "https://example/deck/" && $B js "JSON.stringify(Player.where())"
$B console --errors
```

A CDN cache that was not invalidated serves the old version for hours, and
nobody sees it coming.

## Or hand over the folder

A deck has no build and no dependencies. Zipping the folder and sending it works:
the recipient unzips, double-clicks `index.html`, and it runs. That is often the
right answer for a one-off talk, and it survives a room with no network.
