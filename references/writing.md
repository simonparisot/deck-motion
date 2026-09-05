# What goes on a slide

**Read this before writing a line.** It is the part people get wrong most often,
and the only one the room notices.

## The rule everything else follows from

**The screen does not say what the speaker says.** It shows what speech cannot
show: a magnitude, a shape, a comparison, a ratio. Anything that can be said
should be said, not written.

A slide you can read out loud is a failed slide. If the room is reading, it is
not listening — and it always reads faster than you speak.

## The limits

These are not suggestions. A slide over them gets split.

| Limit | Value |
|---|---|
| Ideas per slide | **one** |
| Visible words, hero figure aside | **15 at most**, 25 for a quotation slide |
| Visual objects per slide | **one**: a figure, or a chart, or an image |
| Bullets in a list | **3 at most**, and zero is better |
| Minimum body size | **24 px** on the 1600 × 900 stage |
| Time on a slide during a talk | 30 to 60 seconds |

The minimum size is a constraint in disguise: **if the type has to shrink to
fit, there is too much text.** You never reduce the size, you cut the text.

## The shape of a slide that works

Three blocks, never more:

1. **A short claim**, at the top. It states the conclusion, not the subject.
2. **A visual object**, in the middle. The figure, the curve, the grid.
3. **A caption**, under the object. What the figure means, in one line.

```html
<section class="slide" id="acquisition">
  <h2 class="title a" data-step="1">One customer in two now comes from digital.</h2>
  <div class="chart"></div>
  <p class="caption a" data-step="2">Week 2 to week 35</p>
</section>
```

## Titles

**The title carries the conclusion.** "Account growth over time" says nothing.
"The rate has doubled since March" says everything, and the curve proves it.

Write the title last, once the chart exists: by then you know what it shows.

No housekeeping titles on screen — "Agenda", "Introduction", "Conclusion",
"Thank you". Structure belongs to the contents panel and to the speaker.

## Figures

**One hero figure per slide.** Large, alone, with its unit. The caption says what
it means, not how it was computed.

Three figures side by side is already a table: the room compares them instead of
listening. If all three matter, they deserve three slides, or a three-step
reveal.

**Round them.** "15,948" is accurate, "close to 16,000" is what people remember.
Keep the precision for the notes and for the question that will come.

**Never show a figure you do not talk about.** If it is on screen, the room reads
it and waits for you to explain it.

## Charts

**One chart, one message.** If two things in the same series are interesting,
make two slides with two different emphases.

Strip everything that does not serve the point: gridlines, the y axis, values on
every bar, a legend that repeats the colours. What is left should read in two
seconds.

**Highlight rather than show everything.** Grey the reference series, colour the
one you are talking about. That is what steps are for: the whole curve first,
then the part that matters.

Never a pie chart with more than three slices, never two vertical axes.

## Text

**No bullet lists.** A list is an outline, not a deck. If three points really
matter, make them three steps that appear as you speak — then the room follows
the talk instead of reading ahead.

**No full sentences in body text.** A short claim, without a verb if you can.
Grammar belongs to the speaker.

**No sources on screen.** They go in the notes. You give them out loud if asked.

**No logo on every slide**, no page numbers, no running header. They eat
attention and give nothing back.

## Pacing over 40 minutes

**Alternate density.** A loaded slide — a chart you talk through — is paid for
with two light ones: a figure alone, a claim alone. A run of charts exhausts the
room in ten minutes.

**A chapter slide between parts.** A title alone on a plain background. It says
nothing new, it gives the landmark the progress bar does not, and it buys the
speaker the time to change subject.

**End on an image, not a summary table.** The last slide stays up during
questions; let it carry the message, not a recap of what you just said.

## Checking

`tools/audit.sh` measures these limits on a real deck: visible words per slide,
number of text blocks, smallest rendered body size, overflow past the stage.

```sh
./tools/audit.sh http://127.0.0.1:8790/index.html
```

It does not replace judgement — a quotation slide legitimately runs past fifteen
words. But a deck with half its slides flagged is a deck the room will read
instead of hear.
